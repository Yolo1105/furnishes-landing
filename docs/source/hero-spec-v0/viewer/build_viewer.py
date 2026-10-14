"""把 build/model.json 注入拼装动画页面模板，生成 build/assembly_viewer.html。
用法：先运行 generate.py，再运行 python3 viewer/build_viewer.py
页面只读数据，不含任何尺寸常量；改尺寸请改 params.yaml 后重新生成。
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
model = json.load(open(os.path.join(ROOT, "build", "model.json"), encoding="utf-8"))

KEEP_PART = ("id", "name", "kind", "group", "material", "size", "pos", "rot", "mass")
data = {
    "version": model["version"],
    "configs": {
        k: {
            "title": c["title"],
            "geo": c["geo"],
            "ports": c["ports"],
            "steps": c["steps"],
            "parts": [{f: p[f] for f in KEEP_PART if f in p} for p in c["parts"]],
        }
        for k, c in model["configs"].items()
    },
    "kits": model["kits"],
    "retired_paths": model["retired_paths"],
    "actions": model.get("actions", {}),
}
tpl = open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
out = tpl.replace("__DATA__", json.dumps(data, ensure_ascii=False, separators=(",", ":"))) \
         .replace("__VERSION__", model["version"].split()[0])
dst = os.path.join(ROOT, "build", "assembly_viewer.html")
open(dst, "w", encoding="utf-8").write(out)
print("wrote", dst, len(out.encode("utf-8")), "bytes")
