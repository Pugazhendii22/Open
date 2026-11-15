"""Mobile pad regression: the right-hand buttons must work while the left
thumb is holding the stick.

Uses real multi-touch through CDP (two simultaneous touch points) because the
bug was that a second finger's click never arrived while the first finger was
still down and dragging.

    python3 tests/touch_pad.py
"""
import asyncio
from playwright.async_api import async_playwright


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(
            args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
        )
        ctx = await b.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        pg = await ctx.new_page()
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        await pg.add_init_script("localStorage.clear()")
        await pg.goto("http://127.0.0.1:8000/index.html?debug", wait_until="load")
        await pg.wait_for_function(
            "()=>document.querySelector('#loading').hidden===true", timeout=90000
        )
        await pg.wait_for_timeout(1500)

        cdp = await ctx.new_cdp_session(pg)

        async def touch(points, kind):
            await cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": points})

        async def centre(sel):
            box = await pg.evaluate(
                """(s)=>{const r=document.querySelector(s).getBoundingClientRect();
                   return [Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)]}""",
                sel,
            )
            return {"x": box[0], "y": box[1], "id": 2}

        def state_expr():
            s = "()=>{const s=window.__ferndebug.state;return {y:+s.y.toFixed(2),"
            s += "queued:s.jumpQueued,dodgeCd:+s.dodgeCd.toFixed(2),"
            s += "stick:s.stick.active,stam:+s.stam.toFixed(0),x:+s.x.toFixed(1),z:+s.z.toFixed(1)}}"
            return s

        await pg.evaluate("()=>{const s=window.__ferndebug.state;s.x=4;s.z=10;s.y=0.15;s.stam=100}")
        stick = {"x": 80, "y": 700, "id": 1}

        async def press_while_walking(sel, settle=420):
            """Hold the stick, tap sel with a second thumb, read state, clear."""
            await touch([stick], "touchStart")
            await pg.wait_for_timeout(200)
            held = await pg.evaluate(state_expr())
            assert held["stick"], "stick did not engage"
            p2 = await centre(sel)
            await touch([stick, p2], "touchStart")
            await pg.wait_for_timeout(settle)
            out = await pg.evaluate(state_expr())
            await touch([], "touchCancel")
            await pg.wait_for_timeout(500)
            return held, out

        # --- JUMP -----------------------------------------------------------
        held, after_jump = await press_while_walking("#act-jump")
        print("jump while walking:", after_jump)
        assert after_jump["y"] > 0.4 or after_jump["queued"], "JUMP dead while stick held"

        # --- DODGE ----------------------------------------------------------
        await pg.evaluate("()=>{const s=window.__ferndebug.state;s.y=0.15;s.stam=100;s.dodgeCd=0}")
        held, after_dodge = await press_while_walking("#act-dodge")
        print("dodge while walking:", after_dodge)
        assert after_dodge["dodgeCd"] > 0, "DODGE dead while stick held"

        # --- season knob on the right ---------------------------------------
        before = await pg.evaluate("()=>window.__ferndebug.state.seasonIndex")
        held, _ = await press_while_walking("#mini-season")
        after = await pg.evaluate("()=>window.__ferndebug.state.seasonIndex")
        print("season", before, "->", after, "(stick was", held["stick"], ")")
        assert after != before, "season knob dead while stick held"

        print("errors:", errors)
        assert not errors, errors
        await b.close()
    print("TOUCH PAD OK")


asyncio.run(main())
