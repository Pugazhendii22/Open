import asyncio
from playwright.async_api import async_playwright
OUT="/home/user/tests"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=["--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    ctx=await b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=await ctx.new_page()
    errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.on("console",lambda m: errs.append("console:"+m.text) if m.type=="error" else None)
    await pg.add_init_script("localStorage.clear()")
    await pg.goto("http://127.0.0.1:8000/index.html?debug",wait_until="load")
    await pg.wait_for_timeout(3000)
    await pg.screenshot(path=f"{OUT}/flow-1-hint.png")
    await pg.wait_for_timeout(4500)
    # walk forward toward the sign / charm
    await pg.mouse.move(90,690); await pg.mouse.down(); await pg.mouse.move(90,470,steps=10)
    await pg.wait_for_timeout(2500); await pg.mouse.up(); await pg.wait_for_timeout(500)
    await pg.screenshot(path=f"{OUT}/flow-2-walk.png")
    st=await pg.evaluate("()=>[+window.__ferndebug.state.x.toFixed(1),+window.__ferndebug.state.z.toFixed(1)]")
    print("pos",st)
    # try USE if visible
    vis=await pg.evaluate("()=>{const e=document.querySelector('#mobile-interact');return !e.hidden}")
    print("use visible",vis)
    if vis:
      await pg.click("#mobile-interact"); await pg.wait_for_timeout(700)
      await pg.screenshot(path=f"{OUT}/flow-3-use.png")
      # close dialogue by tapping it
      d=await pg.evaluate("()=>!document.querySelector('#dialogue').hidden")
      if d:
        await pg.click("#dialogue"); await pg.wait_for_timeout(400)
    # photo mode
    await pg.click("#mobile-photo"); await pg.wait_for_timeout(600)
    await pg.screenshot(path=f"{OUT}/flow-4-photo.png")
    await pg.click("#photo-hint"); await pg.wait_for_timeout(500)
    shot=[await pg.evaluate("()=>document.querySelector('#app').classList.contains('photo-mode')")]
    print("photo still on?",shot)
    # help tab
    await pg.click("#map-button"); await pg.wait_for_timeout(400)
    await pg.click(".guide-tab[data-tab='help']"); await pg.wait_for_timeout(500)
    await pg.screenshot(path=f"{OUT}/flow-5-help.png")
    await pg.click("#overlay-close"); await pg.wait_for_timeout(300)
    # season + time mini controls
    await pg.click("#mini-season"); await pg.wait_for_timeout(1200)
    await pg.click("#mini-time"); await pg.wait_for_timeout(1200)
    await pg.screenshot(path=f"{OUT}/flow-6-season.png")
    print("errors:",errs[:6])
    await b.close()
asyncio.run(main())
