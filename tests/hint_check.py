import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=["--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=await b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=await ctx.new_page()
    errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    await pg.goto("http://127.0.0.1:8000/index.html?debug",wait_until="load")
    await pg.wait_for_function("()=>{const l=document.querySelector('#loading');return l.hidden===true}",timeout=40000)
    await pg.wait_for_timeout(500)
    await pg.screenshot(path="/home/user/tests/hint.png")
    print("errors",errs)
    await b.close()
asyncio.run(main())
