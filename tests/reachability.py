"""World connectivity check: flood-fill the walkable grid from the camp and
prove every objective can actually be reached on foot (the islet is the only
place that needs the canoe).

    python3 tests/reachability.py
"""
import asyncio
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8000/index.html?debug"

POINTS = [
    ("camp", 4, 14), ("trailhead", 5, 19), ("cabin path", 23, 18),
    ("cabin door", 28, 17.5), ("lookout foot", 31.5, -23.5),
    ("grove", 13, -21), ("mine mouth", -38, -19), ("mine inside", -38, -27),
    ("deep shard", -43.6, -36.4), ("ruin approach", 24, 41),
    ("ruin south door", 24, 44.6), ("swing tree", -29, 2),
    ("dock end", 0.35, -12.4), ("beach", 1.0, -7.6),
]

CANOE_ONLY = {"islet"}


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(
            args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
        )
        pg = await (await b.new_context()).new_page()
        await pg.goto(URL, wait_until="load")
        await pg.wait_for_function(
            "()=>document.querySelector('#loading').hidden===true", timeout=90000
        )
        await pg.wait_for_timeout(400)
        # the deep shard sits behind the mine gate: open it like the plate does,
        # otherwise the flood fill correctly stops at the gate
        await pg.evaluate("()=>window.__ferndebug.adv.gates.forEach(g=>{g.open=true})")
        await pg.wait_for_timeout(200)
        res = await pg.evaluate(
            """(pts)=>{
          const d=window.__ferndebug,W=d.isWalkable,S=0.5,key=(i,j)=>i+','+j;
          const seen=new Set(),q=[[4,14]];seen.add(key(8,28));
          while(q.length){const [x,z]=q.pop();
            for(const [dx,dz] of [[S,0],[-S,0],[0,S],[0,-S]]){
              const nx=x+dx,nz=z+dz;if(Math.abs(nx)>68||Math.abs(nz)>68)continue;
              const k=key(Math.round(nx/S),Math.round(nz/S));if(seen.has(k))continue;
              if(!W(nx,nz,0.15))continue;seen.add(k);q.push([nx,nz]);}}
          return pts.map(([n,x,z])=>{const i=Math.round(x/S),j=Math.round(z/S);
            let r=false;for(let a=-3;a<=3;a++)for(let bb=-3;bb<=3;bb++)
              if(seen.has(key(i+a,j+bb)))r=true;
            return [n,r]})}""",
            POINTS,
        )
        bad = []
        for name, ok in res:
            print(f"  {'OK ' if ok else 'NO '} {name}")
            if not ok:
                bad.append(name)
        assert not bad, f"unreachable on foot: {bad}"
        print("REACHABILITY OK")
        await b.close()


asyncio.run(main())
