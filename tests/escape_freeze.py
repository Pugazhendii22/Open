"""Regression: collecting the third shard must never freeze you inside a
timed escape. The 'three shards' story beat used to open a modal dialogue at
the same moment the mine flooded, and movement is disabled while a dialogue is
open, so the water caught you no matter how fast you ran.
"""
import asyncio, sys
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        pg = await (await b.new_context(viewport={"width": 720, "height": 520})).new_page()
        await pg.goto(BASE + "/index.html?debug", wait_until="load", timeout=120000)
        await pg.wait_for_function("()=>document.querySelector('#loading').hidden===true", timeout=180000)
        await pg.wait_for_timeout(600)
        # stand at the deep shard with the first two shards in hand
        await pg.evaluate("""()=>{const F=window.__ferndebug,s=F.state;
            s.mode='walk';s.lantern=true;s.found.add(0);s.found.add(1);
            F.adv.hounds.forEach(h=>h.alive=false);
            s.x=-43.0;s.z=-36.0;s.y=F.heightAt(s.x,s.z)}""")
        await pg.wait_for_timeout(500)
        await pg.keyboard.press("KeyE")
        await pg.wait_for_timeout(1400)   # past the 900ms story-beat timer
        st = await pg.evaluate("()=>{const s=window.__ferndebug.state;return {dlg:s.dialogueOpen,flood:s.floodActive,shards:s.found.size,x:s.x,z:s.z}}")
        assert st["shards"] == 3, f"third shard not collected: {st}"
        assert st["flood"], f"flood did not start: {st}"
        assert not st["dlg"], f"a dialogue froze the player mid-flood: {st}"
        x0, z0 = st["x"], st["z"]
        await pg.keyboard.down("KeyW"); await pg.wait_for_timeout(1200); await pg.keyboard.up("KeyW")
        st2 = await pg.evaluate("()=>{const s=window.__ferndebug.state;return {x:s.x,z:s.z,dlg:s.dialogueOpen}}")
        moved = ((st2["x"] - x0) ** 2 + (st2["z"] - z0) ** 2) ** 0.5
        assert moved > 1.0, f"player could not move while the mine flooded (moved {moved:.2f})"
        print(f"ESCAPE-FREEZE OK (moved {moved:.2f} with water rising, no modal dialogue)")
        await b.close()

asyncio.run(main())
