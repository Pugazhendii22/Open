"""Phone controls regression: look around while walking, and tap the prompt.

Two things a thumb cannot do without this:
  * turn the camera while the other thumb holds the stick. A second finger
    used to be read as a pinch-zoom, so yaw never changed while moving.
  * tap the on-world prompt ("Talk with Pip", "Pick up the paddle"). It was a
    plain div, so the most obvious thing to tap did nothing.

    python3 tests/touch_look_and_use.py [base_url]
"""
import asyncio, sys
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


class MultiTouch:
    """Two independent fingers through CDP, like two thumbs on glass."""

    def __init__(self, cdp):
        self.cdp = cdp
        self.pts = {}

    async def _send(self, kind, points):
        await self.cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": points})

    async def down(self, i, x, y):
        self.pts[i] = (x, y)
        await self._send("touchStart", [{"x": x, "y": y, "id": i}])

    async def move(self, i, x, y):
        self.pts[i] = (x, y)
        await self._send("touchMove", [{"x": x, "y": y, "id": k} for k, (x, y) in self.pts.items()])

    async def up(self, i):
        self.pts.pop(i, None)
        await self._send("touchEnd", [{"x": 0, "y": 0, "id": i}])


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        ctx = await b.new_context(viewport={"width": 390, "height": 844},
                                  device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        await pg.add_init_script("localStorage.clear()")
        await pg.goto(BASE + "/index.html?debug", wait_until="load", timeout=120000)
        await pg.wait_for_function("()=>document.querySelector('#loading').hidden===true", timeout=180000)
        await pg.wait_for_timeout(1200)
        cdp = await ctx.new_cdp_session(pg)
        T = MultiTouch(cdp)

        async def st():
            return await pg.evaluate("""()=>{const s=window.__ferndebug.state;return {
                x:+s.x.toFixed(2),z:+s.z.toFixed(2),yaw:+s.yaw.toFixed(3),
                stick:s.stick.active,paddle:!!s.paddle,near:(s.near&&s.near.kind)||null}}""")

        # ---------- 1. turning while the stick is held ----------
        await pg.evaluate("()=>{const s=window.__ferndebug.state;s.x=4;s.z=10;s.y=0.15;s.mode='walk'}")
        await pg.wait_for_timeout(400)
        yaw0 = (await st())["yaw"]
        await T.down(1, 90, 700)                      # left thumb: walk
        await pg.wait_for_timeout(150)
        await T.move(1, 90, 650)
        assert (await st())["stick"], "stick did not engage"
        await T.down(2, 260, 380)                     # right thumb: turn
        await pg.wait_for_timeout(80)
        for i in range(8):
            await T.move(2, 260 + i * 16, 380)
            await pg.wait_for_timeout(70)
        s = await st()
        await T.up(2)
        await T.up(1)
        turn = abs(s["yaw"] - yaw0)
        assert turn > 0.15, f"camera does not turn while walking (yaw moved {turn:.3f})"
        print(f"OK  turn while walking (yaw moved {turn:.2f} rad with the stick held)")

        # ---------- 2. tapping the prompt ----------
        await pg.evaluate("""()=>{const F=window.__ferndebug,s=F.state;
            const pl=F.adv.pickups.find(p=>p.type==='paddle');
            s.x=pl.x;s.z=pl.z+1.0;s.y=F.heightAt(s.x,s.z);s.mode='walk'}""")
        await pg.wait_for_timeout(700)
        s = await st()
        assert s["near"] == "paddle", f"no prompt at the paddle: {s}"
        box = await pg.evaluate("""()=>{const e=document.querySelector('#interact-prompt');
            if(e.hidden)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}""")
        assert box, "the interact prompt is hidden even though something is in reach"
        await T.down(5, box[0], box[1])
        await pg.wait_for_timeout(80)
        await T.up(5)
        await pg.wait_for_timeout(500)
        s = await st()
        assert s["paddle"], f"tapping the prompt did nothing: {s}"
        print("OK  tapping the on-world prompt picks the thing up")

        # ---------- 3. the action circle is on screen ----------
        vis = await pg.evaluate("""()=>{const e=document.querySelector('#mobile-interact');
            const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
            return {shown:cs.display!=='none'&&r.width>0,right:Math.round(r.x+r.width),
                    bottom:Math.round(r.y+r.height),w:window.innerWidth,h:window.innerHeight}}""")
        assert vis["shown"] and vis["right"] <= vis["w"] and vis["bottom"] <= vis["h"], f"USE button off screen: {vis}"
        print("OK  the USE circle is on screen and inside the viewport")


        # ---------- 4. pinch still zooms when no thumb is on the stick ----------
        d0 = await pg.evaluate("()=>+window.__ferndebug.state.distance.toFixed(2)")
        await T.down(3, 250, 300)
        await pg.wait_for_timeout(120)
        await T.down(4, 320, 340)
        await pg.wait_for_timeout(120)
        for i in range(6):
            await T.move(3, 250 - i * 8, 300)
            await T.move(4, 320 + i * 8, 340)
            await pg.wait_for_timeout(70)
        d1 = await pg.evaluate("()=>+window.__ferndebug.state.distance.toFixed(2)")
        await T.up(4)
        await T.up(3)
        assert abs(d1 - d0) > 0.4, f"pinch zoom broke (distance {d0} -> {d1})"
        print(f"OK  two free fingers still pinch the camera ({d0} -> {d1})")

        assert not errors, f"console errors: {errors[:3]}"
        print("TOUCH LOOK + USE OK")
        await b.close()


asyncio.run(main())
