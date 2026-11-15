"""End-to-end regression for The Lost Expedition.

Runs the whole progression over the local http server and asserts each gate:
canoe -> fog islet -> fog shard -> quarry climb -> sky shard -> mine plate ->
deep shard -> flood -> altar -> collapse -> escape ring -> victory.

    python3 tests/adventure_flow.py [--shots]

Screenshots land in tests/flow-*.png (gitignored).
"""
import asyncio
import sys
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8000/index.html?debug"
SHOTS = "--shots" in sys.argv


def shot(pg, name):
    if SHOTS:
        return pg.screenshot(path=f"tests/flow-{name}.png")
    return asyncio.sleep(0)


async def main():
    errors = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
        )
        ctx = await browser.new_context(viewport={"width": 1280, "height": 800})
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errors.append(str(e)))
        await pg.add_init_script("localStorage.clear()")
        await pg.goto(URL, wait_until="load")
        await pg.wait_for_function(
            "()=>document.querySelector('#loading').hidden===true", timeout=90000
        )
        await pg.wait_for_timeout(900)

        async def state():
            return await pg.evaluate(
                "()=>{const s=window.__ferndebug.state;return {x:+s.x.toFixed(1),z:+s.z.toFixed(1),"
                "y:+s.y.toFixed(1),hp:s.hp,mode:s.mode,shards:s.found.size,"
                "flood:s.floodActive,collapse:s.collapseActive,won:s.won}}"
            )

        async def near():
            return await pg.evaluate(
                "()=>{const n=window.__ferndebug.state.near;return n?n.kind:null}"
            )

        async def clear_dialogue():
            if await pg.evaluate("()=>!document.querySelector('#dialogue').hidden"):
                await pg.keyboard.press("Escape")
                await pg.wait_for_timeout(350)

        async def put(x, z, y=None):
            await pg.evaluate(
                """([x,z,y])=>{const s=window.__ferndebug.state;s.mode='walk';s.x=x;s.z=z;
                   if(y!==null){s.y=y;s.grounded=true}}""",
                [x, z, y],
            )
            await pg.wait_for_timeout(650)

        # 1. canoe across the fog lake -------------------------------------
        await put(1.5, -11.0)
        await clear_dialogue()
        print("near paddle:", await near())
        await pg.keyboard.press("KeyE")            # take the paddle
        await pg.wait_for_timeout(600)
        await clear_dialogue()
        await put(-1.8, -13.9)
        await clear_dialogue()
        print("near canoe:", await near())
        await pg.keyboard.press("KeyE")            # board the canoe
        await pg.wait_for_timeout(900)
        print("boarded:", await state())
        assert (await state())["mode"] == "canoe", "could not board the canoe"
        await shot(pg, "1-canoe")

        # row to the islet and beach
        await pg.evaluate("()=>{const s=window.__ferndebug.state;s.x=-12.85;s.z=-12}")
        await pg.wait_for_timeout(1600)
        print("beached:", await state())
        assert (await state())["mode"] == "walk", "canoe did not beach on the islet"

        await put(-16, -12)
        assert await near() == "charm", "fog shard prompt missing"
        await pg.keyboard.press("KeyE")
        await pg.wait_for_timeout(700)
        print("fog shard:", await state())
        assert (await state())["shards"] >= 1, "fog shard not collected"
        await shot(pg, "2-islet")

        # combat is covered by tests/combat_check.py -- clear the hounds so the
        # traversal assertions below measure movement, not a mauling
        await pg.evaluate(
            "()=>window.__ferndebug.adv.hounds.forEach(h=>{h.alive=false;h.x=800;h.z=800})"
        )

        # 2. quarry climb to the sky shard --------------------------------
        # Walk the column staircase the way a player does: head for the next
        # column, let the step-up carry you, repeat.
        await put(32.6, -22.6)
        ledges = [(32.8, -25.4, 1.3), (34.2, -26.9, 2.6), (33.2, -28.9, 3.9),
                  (31.4, -30.0, 5.2), (29.4, -30.4, 6.5)]
        await pg.keyboard.down("KeyW")
        for i in range(160):
            y = (await state())["y"]
            nxt = next((l for l in ledges if l[2] > y + 0.15), ledges[-1])
            await pg.evaluate(
                """([tx,tz])=>{const s=window.__ferndebug.state;
                   const ux=tx-s.x,uz=tz-s.z,L=Math.hypot(ux,uz)||1;
                   s.yaw=Math.atan2(-ux/L,-uz/L)}""",
                [nxt[0], nxt[1]],
            )
            if i % 12 == 6:                        # a hop helps clear a gap
                await pg.keyboard.press("Space")
            await pg.wait_for_timeout(110)
            if y > 6.2:
                break
        await pg.keyboard.up("KeyW")
        await pg.wait_for_timeout(400)
        climbed = await state()
        print("after climb:", climbed)
        assert climbed["y"] > 6.0, f"climb stalled at y={climbed['y']}"
        await put(29.4, -30.4, 6.5)
        assert await near() == "charm", "sky shard prompt missing"
        await pg.keyboard.press("KeyE")
        await pg.wait_for_timeout(700)
        assert (await state())["shards"] >= 2, "sky shard not collected"
        await shot(pg, "3-lookout")

        # 3. mine: lantern, weight plate, deep shard, flood ----------------
        await put(-37.4, -22.2)
        await near()
        await pg.keyboard.press("KeyE")            # lantern
        await pg.wait_for_timeout(600)
        print("lantern:", await pg.evaluate("()=>window.__ferndebug.state.lantern"))
        assert await pg.evaluate("()=>window.__ferndebug.state.lantern"), "lantern not taken"

        # shove the stone onto the plate, then walk through the gate
        await pg.evaluate(
            """()=>{const d=window.__ferndebug.adv;const s=d.pushables[0];
               s.x=-38;s.z=-31.4;}"""
        )
        await pg.wait_for_timeout(900)
        print("plate:", await pg.evaluate("()=>window.__ferndebug.adv.checkPlate()"))
        await pg.wait_for_timeout(600)
        gate_open = await pg.evaluate(
            "()=>window.__ferndebug.adv.gates.every(g=>g.open!==false)"
        )
        print("gates open:", gate_open)

        await put(-43.6, -36.4)
        assert await near() == "charm", "deep shard prompt missing"
        await pg.keyboard.press("KeyE")
        await pg.wait_for_timeout(900)
        st = await state()
        print("deep shard:", st)
        assert st["shards"] >= 3, "deep shard not collected"
        assert st["flood"], "flood did not start"
        await shot(pg, "4-mine-flood")

        # 4. ruin: altar, collapse, escape ---------------------------------
        await put(24, 39.0)
        await clear_dialogue()                     # the "three shards" note
        assert await near() == "altar", "altar prompt missing"
        await shot(pg, "5-altar")
        await pg.keyboard.press("KeyE")
        await pg.wait_for_timeout(900)
        st = await state()
        print("collapse:", st)
        assert st["collapse"], "collapse did not start"

        await put(24, 44.6)
        await pg.wait_for_timeout(1400)
        st = await state()
        print("finish:", st)
        overlay = await pg.evaluate(
            "()=>!document.querySelector('#victory-overlay').hidden"
        )
        assert st["won"] and overlay, "victory did not fire"
        await shot(pg, "6-victory")

        print("errors:", errors)
        assert not errors, errors
        await browser.close()
    print("ADVENTURE FLOW OK")


asyncio.run(main())
