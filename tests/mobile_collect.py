import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=["--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=await b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=await ctx.new_page()
    errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
    await pg.add_init_script("localStorage.clear()")
    await pg.goto("http://127.0.0.1:8000/index.html?debug",wait_until="load")
    await pg.wait_for_function("()=>document.querySelector('#loading').hidden===true",timeout=40000)
    # stand next to the first charm
    await pg.evaluate("()=>{const s=window.__ferndebug.state;s.x=0.6;s.z=4.2;}")
    await pg.wait_for_timeout(900)
    print("prompt:",await pg.evaluate("()=>[document.querySelector('#interact-prompt').hidden,document.querySelector('#interact-text').textContent,document.querySelector('#mobile-interact').hidden]"))
    await pg.screenshot(path="/home/user/tests/collect-1.png")
    await pg.tap("#mobile-interact")
    await pg.wait_for_timeout(900)
    await pg.screenshot(path="/home/user/tests/collect-2.png")
    print("count:",await pg.evaluate("()=>document.querySelector('#progress-count').textContent.trim()"),
          "mini:",await pg.evaluate("()=>document.querySelector('#quest-mini-count').textContent"),
          "saved:",await pg.evaluate("()=>localStorage.getItem('fernwood-save-v1')"))
    # talk to an NPC: mira at (8.4,9.2)
    await pg.evaluate("()=>{const s=window.__ferndebug.state;s.x=8.4;s.z=9.6;}")
    await pg.wait_for_timeout(800)
    await pg.tap("#mobile-interact"); await pg.wait_for_timeout(700)
    await pg.screenshot(path="/home/user/tests/collect-3-dialogue.png")
    print("dialogue open:",await pg.evaluate("()=>!document.querySelector('#dialogue').hidden"))
    await pg.tap("#dialogue"); await pg.wait_for_timeout(400)
    print("dialogue closed:",await pg.evaluate("()=>document.querySelector('#dialogue').hidden"))
    print("errors",errs)
    await b.close()
asyncio.run(main())
