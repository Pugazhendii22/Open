import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=["--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=await b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=await ctx.new_page()
    errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
    await pg.goto("http://127.0.0.1:8000/index.html?debug",wait_until="load")
    await pg.wait_for_function("()=>document.querySelector('#loading').hidden===true",timeout=40000)
    await pg.set_viewport_size({"width":844,"height":390})
    await pg.wait_for_timeout(1200)
    await pg.screenshot(path="/home/user/tests/rotate-land.png")
    # walk in landscape
    await pg.mouse.move(90,300); await pg.mouse.down(); await pg.mouse.move(90,200,steps=5)
    await pg.wait_for_timeout(1500); await pg.mouse.up()
    await pg.screenshot(path="/home/user/tests/rotate-land-move.png")
    await pg.set_viewport_size({"width":390,"height":844})
    await pg.wait_for_timeout(1000)
    await pg.screenshot(path="/home/user/tests/rotate-port.png")
    print("errors",errs)
    await b.close()
asyncio.run(main())
