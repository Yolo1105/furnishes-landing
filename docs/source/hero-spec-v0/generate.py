"""Furnishes 主样建模规格 v0 · 生成器

读取 params.yaml，生成：
  build/model.json    全部配置的已解算零件（尺寸、位置、特征、端口）+ 装配步骤 + 加装套件
  build/cutlist.csv   开料与采购清单（按配置）
  build/checks.md     尺寸链、干涉、板数对账、稳定性粗算、槽与孔检查
用法：python3 generate.py
几何规则全部写在本文件中；改参数只改 params.yaml。
"""
import json, csv, math, os, itertools
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
P = yaml.safe_load(open(os.path.join(HERE, "params.yaml"), encoding="utf-8"))
def v(sec, key): return P[sec][key]["value"]

G = {k: x["value"] for k, x in P["global"].items()}
T, TP, TF = G["T_board"], G["T_panel"], G["T_face"]
GD, GC, GBI = G["groove_depth"], G["groove_clear"], G["groove_back_inset"]
FC, PVC = G["fit_clear"], G["panel_vert_clear"]
RHO = G["ply_density"] / 1e9  # kg/mm³


class Part:
    def __init__(self, pid, name, kind, size, pos, material, group, **kw):
        self.id, self.name, self.kind = pid, name, kind
        self.size = [round(s, 2) for s in size]      # x,y,z extents (AABB)
        self.pos = [round(p, 2) for p in pos]        # min corner
        self.material, self.group = material, group  # group: 结构板/面板/层板/金属/配件/挂载面
        self.cut = kw.get("cut")                     # (长, 宽, 厚) 开料尺寸，板件才有
        self.features = kw.get("features", [])
        self.mass = kw.get("mass")
        self.note = kw.get("note", "")
        self.rot = kw.get("rot")                     # 可选：{"axis":"x","deg":15}
        if self.mass is None and self.cut:
            self.mass = round(self.cut[0] * self.cut[1] * self.cut[2] * RHO, 2)
    @property
    def box(self):
        return [(self.pos[i], self.pos[i] + self.size[i]) for i in range(3)]
    def to(self):
        d = dict(id=self.id, name=self.name, kind=self.kind, group=self.group, material=self.material,
                 size=self.size, pos=self.pos, mass=self.mass, features=self.features, note=self.note)
        if self.cut: d["cut"] = self.cut
        if self.rot: d["rot"] = self.rot
        return d


def pin_rows(x_face, depth_front, depth_back, z0, z1):
    """层板销孔：两排（前、后），竖向32节距。返回特征列表。"""
    zs, z = [], z0 + G["pin_z_margin"]
    while z <= z1 - G["pin_z_margin"]:
        zs.append(round(z, 1)); z += G["pin_pitch"]
    return [{"type": "hole", "dia": G["pin_dia"], "depth": 10, "face_x": x_face,
             "y": y, "z_list": zs} for y in (depth_front, depth_back)]


def frame_F1200(D, base="wide"):
    W, H = v("frame_F1200", "W"), v("frame_F1200", "H_side")
    hb = v("base_wide", "height")
    bd = v("base_wide", "depth") if base == "wide" else D
    parts, ports = [], []
    iw = W - 2 * T
    panel_back = D - GBI
    panel_front = panel_back - TP
    groove = {"type": "groove", "width": TP + 2 * GC, "depth": GD, "y_from": panel_front - GC,
              "y_to": panel_back + GC, "z_from": 0, "z_to": H, "note": "通槽，自顶端滑入面板"}
    beam_d = panel_front - 1
    # 底座
    parts.append(Part("BASE", "加宽钢底座（含调节脚×4、配重槽）" if base == "wide" else "脚垫底座",
                      "metal", [W, bd, hb], [0, D - bd, 0], "粉末喷涂钢", "金属",
                      mass=v("base_wide", "mass"),
                      features=[{"type": "bolt_pattern", "port": 6, "xy": v("base_wide", "bolt_pattern"), "thread": "M6"}],
                      note="D13：1.2米挂物件标配加宽底座"))
    if base == "wide":
        parts.append(Part("CW", "配重板", "metal", [W - 80, bd - 80, 12], [40, D - bd + 40, 10], "钢", "金属",
                          mass=v("base_wide", "counterweight"), note="放入底座配重槽"))
    # 竖板
    for side, x0, face in (("SL", 0, T), ("SR", W - T, W - T)):
        feats = [dict(groove, face_x=face)]
        feats += pin_rows(face, G["pin_front_setback"], beam_d - G["pin_back_setback"], 0, H)
        feats += [{"type": "dowel_hole", "dia": 8, "depth": 15, "end": "bottom", "y_list": [80, D - 80]},
                  {"type": "connector_plate", "end": "bottom", "qty": 2, "note": "预装连接片，M6向下锁入底座（A1）"},
                  {"type": "connector_plate", "end": "top", "qty": 2, "note": "预装连接片，M6向上锁入顶盖底面嵌件（A6）"},
                  {"type": "insert", "thread": "M6", "face_x": face, "y_list": [60, beam_d - 60],
                   "z": v("frame_F1200", "beam_z") + T / 2, "note": "底梁锁紧（A3）"}]
        parts.append(Part(side, "F1200整高竖板" + ("（左）" if side == "SL" else "（右）"), "board",
                          [T, D, H], [x0, 0, hb], "桦木胶合板", "结构板", cut=(H, D, T), features=feats))
    # 端口（竖板相关）
    ports += [
        {"id": 1, "name": "层板销孔列", "where": "两侧竖板内侧", "spec": "Ø5／32节距／前后两排"},
        {"id": 3, "name": "镜／显示器重托嵌件对", "where": "右竖板外侧面", "x": W, "y": [100, D - 100],
         "z": v("desk_pack", "monitor_port_z") , "spec": "M6面嵌件×2，带隐藏盖"},
        {"id": 4, "name": "衣杆／挂杆嵌件对", "where": "两侧竖板内侧", "y": D / 2, "z": hb + H - 120, "spec": "M6面嵌件×2"},
        {"id": 6, "name": "底座通用螺栓孔型", "where": "底座顶面", "spec": "4×M6", "xy": v("base_wide", "bolt_pattern")},
        {"id": 8, "name": "门铰链底座孔位", "where": "两侧竖板内侧下层", "spec": "35杯铰链底座孔，预装【假设X32】"},
        {"id": 11, "name": "桌板托架嵌件对", "where": "右竖板外侧面", "x": W, "y": [80, D - 80],
         "z": P["desk_kit"]["top_z"]["value"] - P["desk_kit"]["top"]["value"]["t"] - 60, "spec": "M6面嵌件×2；书桌旁版本出厂预装【假设X33】"},
    ]
    # 底梁
    parts.append(Part("BEAM", "结构底梁", "board", [iw - FC, beam_d, T],
                      [T + FC / 2, 0, hb + v("frame_F1200", "beam_z")], "桦木胶合板", "结构板",
                      cut=(iw - FC, beam_d, T), features=[{"type": "connector_plate", "qty": 4, "note": "底面预装，两端各2颗锁入竖板面嵌件"}]))
    # 面板 ×3（后位，入槽）
    pw = iw + 2 * (GD - GC)
    for i in range(3):
        parts.append(Part(f"PNL{i+1}", f"分层面板 {i+1}（下→上）", "board", [pw, TP, 400 - PVC],
                          [T - GD + GC, panel_front, hb + i * 400 + PVC / 2], "桦木胶合板", "面板",
                          cut=(pw, 400 - PVC, TP),
                          features=[{"type": "hidden_retainer", "qty": 1, "note": "隐藏防脱件（D6／A2首选方案）"}]))
    # 顶盖
    parts.append(Part("TOP", "顶盖", "board", [W, D, T], [0, 0, hb + H], "桦木胶合板", "结构板", cut=(W, D, T),
                      features=[{"type": "insert", "thread": "M6", "face": "underside", "qty": 4, "note": "接竖板连接片"},
                                {"type": "insert", "thread": "M6", "face": "top", "port": 5, "xy": [[150, D - 40], [450, D - 40]], "note": "端口5：立板孔，带塞"}]))
    ports.append({"id": 5, "name": "顶面立板孔", "where": "顶盖", "spec": "M6×2，带塞"})
    geo = dict(W=W, D=D, H=H, hb=hb, iw=iw, beam_d=beam_d, panel_front=panel_front, panel_back=panel_back, base_depth=bd)
    return parts, ports, geo


def entry_pack(D=None, base="wide"):
    D = D or v("frame_F1200", "D")
    parts, ports, g = frame_F1200(D, base)
    sb = v("entry_pack", "shoe_board"); a = math.radians(sb["angle_deg"])
    sw = g["iw"] - FC
    parts.append(Part("SHOE", "鞋斜板（前低后高）", "board", [sw, sb["d"] * math.cos(a), sb["d"] * math.sin(a) + T],
                      [T + FC / 2, 10, sb["front_edge_z"]], "桦木胶合板", "层板", cut=(sw, sb["d"], sb["t"]),
                      rot={"axis": "x", "deg": sb["angle_deg"]}, note="落在前低后高两组层板销上；前沿挡条另计"))
    nz = v("entry_pack", "narrow_shelf_z")
    parts.append(Part("NSH", "窄层板", "board", [sw, 190, T], [T + FC / 2, 0, nz - T], "桦木胶合板", "层板", cut=(sw, 190, T)))
    hf = v("entry_pack", "hanging_face")
    fy = g["panel_front"] - hf["spacer"] - TF
    parts.append(Part("FACE", "挂载面（方案b：薄穿孔面）", "board", [g["iw"] - 2, TF, hf["z_to"] - hf["z_from"]],
                      [T + 1, fy, hf["z_from"]], "穿孔胶合板或粉末喷涂钢板", "挂载面",
                      cut=(g["iw"] - 2, hf["z_to"] - hf["z_from"], TF),
                      features=[{"type": "spacer", "qty": 4, "length": hf["spacer"], "note": "锁入面板或竖板嵌件"},
                                {"type": "perforation", "pattern": "自有孔形，待D6样件与FTO", "id": "X20"}]))
    ports.append({"id": 2, "name": "挂载区", "where": "上层", "z": [hf["z_from"], hf["z_to"]], "spec": "方案b；方案a备选"})
    hk = v("entry_pack", "hooks")
    for i in range(hk["count"]):
        x = T + 80 + i * (g["iw"] - 160 - 30) / max(1, hk["count"] - 1)
        parts.append(Part(f"HOOK{i+1}", f"大衣钩 {i+1}", "accessory", [30, 50, 60], [x, fy - 50, hk["z"] - 60],
                          "粉末喷涂钢", "配件", mass=0.15))
    kz = v("entry_pack", "key_tray_z")
    parts.append(Part("KEY", "钥匙托", "accessory", [140, 70, 40], [T + 40, fy - 70, kz - 40], "胶合板＋钢挂件", "配件", mass=0.3))
    ux = v("entry_pack", "umbrella_x")
    parts.append(Part("UMB", "伞架（挂环）", "accessory", [60, 60, 30], [ux, fy - 60, hf["z_from"] + 10], "粉末喷涂钢", "配件", mass=0.2))
    return parts, ports, g


def desk_pack(D=None, base="wide", with_rail=True):
    D = D or v("frame_F1200", "D")
    parts, ports, g = frame_F1200(D, base)
    sw = g["iw"] - FC
    for i, z in enumerate(v("desk_pack", "shelf_z")):
        parts.append(Part(f"SH{i+1}", f"全深层板 {i+1}", "board", [sw, g["beam_d"], T], [T + FC / 2, 0, z - T],
                          "桦木胶合板", "层板", cut=(sw, g["beam_d"], T)))
    if with_rail:
        r = v("desk_pack", "rail")
        parts.append(Part("RAIL", "铝轨（可选）", "metal", [r["length"], 12, 30], [(g["W"] - r["length"]) / 2, g["panel_front"] - 12, r["z"]],
                          "阳极氧化铝", "金属", mass=0.4, features=[{"type": "port", "port": 7}]))
        ports.append({"id": 7, "name": "铝轨槽位", "where": "面板前，书桌旁版本", "z": r["z"], "spec": "两端支架锁入竖板内侧嵌件"})
    parts.append(Part("CBL", "线槽", "accessory", [400, 60, 40], [T + 60, 0, v("desk_pack", "shelf_z")[0] - T - 40], "钢", "配件", mass=0.4))
    parts.append(Part("PEN", "笔筒", "accessory", [70, 70, 100], [g["W"] - T - 120, 40, v("desk_pack", "shelf_z")[0]], "钢", "配件", mass=0.2))
    parts.append(Part("BOOKEND", "书立", "accessory", [20, 150, 160], [T + 40, 60, v("desk_pack", "shelf_z")[1]], "钢", "配件", mass=0.3))
    return parts, ports, g


def desk_kit_parts(g):
    k = P["desk_kit"]; top = k["top"]["value"]; tz = k["top_z"]["value"]
    x0 = g["W"]
    return [
        Part("DESK", "桌板 1200×600", "board", [top["l"], top["w"], top["t"]], [x0, 0, tz - top["t"]], "桦木胶合板", "层板",
             cut=(top["l"], top["w"], top["t"]), features=[{"type": "stiffener", "note": k["stiffener"]["value"]}]),
        Part("BRK", "重托架×2（锁入端口11）", "metal", [40, 300, 120], [x0, 50, tz - top["t"] - 120], "钢", "金属", mass=1.2),
        Part("LEG", "钢制全高桌腿总成", "metal", [40, 560, tz - top["t"]], [x0 + top["l"] - 60, 20, 0], "粉末喷涂钢", "金属", mass=4.0),
        Part("STF", "桌板底部加强方管", "metal", [top["l"] - 100, 30, 15], [x0 + 50, top["w"] / 2 - 15, tz - top["t"] - 15], "钢", "金属", mass=1.5),
    ]


def lowblock(tiers=1):
    W, H, D = v("frame_lowblock", "W"), v("frame_lowblock", "H_side"), v("frame_lowblock", "D")
    hl = v("frame_lowblock", "legs")
    parts, ports = [], []
    iw = W - 2 * T; panel_back = D - GBI; panel_front = panel_back - TP; beam_d = panel_front - 1
    parts.append(Part("LEGS", "钢脚架（约150高，含调节脚）", "metal", [W, D, hl], [0, 0, 0], "粉末喷涂钢", "金属", mass=3.0,
                      features=[{"type": "bolt_pattern", "port": 6, "xy": [[60, 60], [540, 60], [60, 340], [540, 340]], "thread": "M6"}]))
    for t in range(tiers):
        z0 = hl + t * H
        for side, x0, face in (("L", 0, T), ("R", W - T, W - T)):
            feats = [{"type": "groove", "width": TP + 2 * GC, "depth": GD, "face_x": face, "y_from": panel_front - GC, "y_to": panel_back + GC, "z_from": 0, "z_to": H}]
            feats += pin_rows(face, G["pin_front_setback"], beam_d - G["pin_back_setback"], 0, H)
            if t > 0:
                feats.append({"type": "crossover_plate", "qty": 1, "note": "A5：上层竖板内侧下端预装跨接板，锁入下层竖板面嵌件（D14）"})
            parts.append(Part(f"S{side}{t+1}", f"S400竖板（{'左' if side=='L' else '右'}，第{t+1}层）", "board", [T, D, H], [x0, 0, z0],
                              "桦木胶合板", "结构板", cut=(H, D, T), features=feats))
        parts.append(Part(f"PNL{t+1}", f"面板（第{t+1}层）", "board", [iw + 2 * (GD - GC), TP, H - PVC], [T - GD + GC, panel_front, z0 + PVC / 2],
                          "桦木胶合板", "面板", cut=(iw + 2 * (GD - GC), H - PVC, TP)))
    parts.append(Part("BEAM", "结构底梁（兼底板）", "board", [iw - FC, beam_d, T], [T + FC / 2, 0, hl], "桦木胶合板", "结构板", cut=(iw - FC, beam_d, T)))
    parts.append(Part("TOPB", "台面", "board", [W, D, T], [0, 0, hl + tiers * H], "桦木胶合板", "结构板", cut=(W, D, T),
                      features=[{"type": "insert", "thread": "M6", "face": "underside", "qty": 4}]))
    if tiers == 1:
        parts.append(Part("TRAY", "浅托盘（充电线槽）", "accessory", [300, 200, 25], [150, 60, hl + H + T], "胶合板", "配件", mass=0.4))
    ports += [{"id": 1, "name": "层板销孔列", "where": "两侧竖板内侧"}, {"id": 6, "name": "底座通用螺栓孔型", "where": "脚架"},
              {"id": 9, "name": "台面底面嵌件", "where": "台面"}, {"id": 10, "name": "叠层跨接板位", "where": "竖板顶端", "spec": "D14"}]
    return parts, ports, dict(W=W, D=D, H=H * tiers, hb=hl, iw=iw, beam_d=beam_d, panel_front=panel_front, base_depth=D)


# ---------------- 装配步骤 ----------------
def S(sid, title, action, parts, frm, fasteners, tool, people, check, pre=""):
    return dict(id=sid, title=title, action=action, parts=parts, from_offset=frm, fasteners=fasteners,
                tool=tool, people=people, check=check, precondition=pre)

def steps_frame(prefix_parts_extra=None):
    return [
        S(1, "放底座并调平，放入配重", "A0", ["BASE", "CW"], [0, 0, 300], [], "随附L扳手（调节脚）", 1, "底座水平泡居中；配重板落入槽内", "清出约1.2×1.6米工作区"),
        S(2, "立左竖板：定位销对孔，连接片锁入底座", "A1", ["SL"], [-300, 0, 200], [{"type": "M6手拧两用头", "qty": 2, "at": "左竖板底端连接片"}], "手拧", 1, "竖板不扶也能立住"),
        S(3, "立右竖板", "A1", ["SR"], [300, 0, 200], [{"type": "M6手拧两用头", "qty": 2, "at": "右竖板底端连接片"}], "手拧", 1, "两竖板平行，内侧槽口相对"),
        S(4, "装结构底梁：放在支承销上，两端锁紧", "A3", ["BEAM"], [0, -400, 0], [{"type": "M6手拧", "qty": 4, "at": "底梁两端底面连接片"}], "手拧", 1, "推动竖板顶端，框体不晃"),
    ]

def steps_panels_top(first_id):
    return [
        S(first_id, "面板1：从顶端滑入两侧后槽，落到底", "A2", ["PNL1"], [0, 0, 1400], [], "无", 2, "面板落底有“嗒”声；一人扶竖板顶端", "顶盖尚未安装"),
        S(first_id + 1, "面板2：同样滑入，压在面板1上", "A2", ["PNL2"], [0, 0, 1400], [], "无", 2, "接缝等宽"),
        S(first_id + 2, "面板3：滑入", "A2", ["PNL3"], [0, 0, 1400], [{"type": "隐藏防脱件", "qty": 3, "at": "每块面板一处"}], "无", 2, "三块面板齐平，无高低差"),
        S(first_id + 3, "装顶盖：压住面板，竖板顶端连接片向上锁入", "A6", ["TOP"], [0, 0, 400], [{"type": "M6手拧", "qty": 4, "at": "两竖板顶端连接片"}], "手拧", 2, "顶盖与竖板外沿齐平；整件不晃"),
    ]

def steps_entry():
    s = steps_frame()
    s.append(S(5, "放鞋斜板：落在前低后高两组层板销上", "A4", ["SHOE"], [0, -500, 0], [{"type": "层板销", "qty": 4, "at": "前后两排"}], "无", 1, "前沿挡条朝上，板面不翘"))
    s += steps_panels_top(6)
    s.append(S(10, "放窄层板", "A4", ["NSH"], [0, -500, 0], [{"type": "层板销", "qty": 4}], "无", 1, "层板落销到底"))
    s.append(S(11, "装挂载面：间隔件锁入，薄穿孔面挂上", "A13*", ["FACE"], [0, -400, 0], [{"type": "间隔件＋M6", "qty": 4}], "手拧", 1, "挂载面与面板间留约20空隙"))
    s.append(S(12, "挂配件：大衣钩、钥匙托、伞架", "A13", ["HOOK1", "HOOK2", "HOOK3", "KEY", "UMB"], [0, -300, 0], [], "无", 1, "挂件锁定扣到位，轻拉不脱"))
    s.append(S(13, "最后检查；需要时安装附送防倾固定件", "检查", [], [0, 0, 0], [{"type": "墙面固定带", "qty": 1, "at": "顶盖后沿（可选）"}], "螺丝刀（仅固定件）", 1, "按说明的挂物范围使用"))
    return s

def steps_desk(with_rail=True):
    s = steps_frame()
    s += steps_panels_top(5)
    s.append(S(9, "放两块全深层板", "A4", ["SH1", "SH2"], [0, -500, 0], [{"type": "层板销", "qty": 8}], "无", 1, "层板水平、落销到底"))
    n = 10
    if with_rail:
        s.append(S(n, "装铝轨（可选）：两端支架锁入竖板内侧", "A13*", ["RAIL"], [0, -400, 0], [{"type": "M6", "qty": 2}], "随附L扳手", 1, "铝轨水平")); n += 1
    s.append(S(n, "装线槽、笔筒、书立", "A13", ["CBL", "PEN", "BOOKEND"], [0, -300, 0], [], "无", 1, "线可从线槽进入"))
    s.append(S(n + 1, "最后检查；需要时安装附送防倾固定件", "检查", [], [0, 0, 0], [{"type": "墙面固定带", "qty": 1, "at": "顶盖后沿（可选）"}], "螺丝刀（仅固定件）", 1, "按说明的挂物范围使用"))
    return s

def steps_bedside():
    return [
        S(1, "放钢脚架并调平", "A0", ["LEGS"], [0, 0, 250], [], "随附L扳手", 1, "四脚落地不晃"),
        S(2, "立左竖板，锁入脚架", "A1", ["SL1"], [-300, 0, 150], [{"type": "M6手拧两用头", "qty": 2}], "手拧", 1, "竖板直立"),
        S(3, "立右竖板", "A1", ["SR1"], [300, 0, 150], [{"type": "M6手拧两用头", "qty": 2}], "手拧", 1, "槽口相对"),
        S(4, "装结构底梁（兼底板）", "A3", ["BEAM"], [0, -400, 0], [{"type": "M6手拧", "qty": 4}], "手拧", 1, "框体不晃"),
        S(5, "面板从顶端滑入后槽", "A2", ["PNL1"], [0, 0, 600], [{"type": "隐藏防脱件", "qty": 1}], "无", 1, "面板落底"),
        S(6, "装台面", "A9", ["TOPB"], [0, 0, 300], [{"type": "M6手拧", "qty": 4}], "手拧", 1, "台面齐平"),
        S(7, "放浅托盘", "A13", ["TRAY"], [0, 0, 200], [], "无", 1, "充电线可从后部出线"),
    ]


# ---------------- 加装套件 ----------------
KITS = [
  # F1200 玄关包
  dict(id="K-E1", name="换成书桌旁包", applies="entry", tier="先卖", ports=[1, 7], add=["全深层板×2", "书桌旁配件包"], remove=["鞋斜板", "窄层板", "挂载面", "玄关配件包"], leftover="撤下件登记去向（可留作日后换回）", steps="A13拆配件 → A4取下层板 → A4放全深层板×2 → A13装配件", legacy="1.1 变书桌旁 ✓"),
  dict(id="K-E2", name="并排一段（双人玄关）", applies="entry", tier="先卖", ports=[6], add=["完整F1200功能面一套", "段间联结螺栓×4"], remove=[], leftover="无", steps="另一段按原步骤装好 → A7两竖板贴合锁紧", legacy="1.1 双人玄关 ✓"),
  dict(id="K-E3", name="下层门", applies="entry", tier="先卖", ports=[8], add=["门板×1（预装卡入铰链）"], remove=[], leftover="无", steps="A14卡入铰链底座 → 调门缝", legacy="K.8 门×1遮鞋"),
  dict(id="K-E4", name="抽屉模块", applies="entry,desk", tier="先卖", ports=[1], add=["抽屉模块×1"], remove=[], leftover="无", steps="A15落销 → 推入", legacy="K.8 抽屉模块"),
  dict(id="K-E5", name="换面型（实面／织物）", applies="entry,desk", tier="先卖", ports=[], add=["面板×1–3（新面型）"], remove=["原面板"], leftover="原面板登记去向", steps="A6松开顶盖 → A2抽出面板 → A2滑入新面板 → A6锁回顶盖", legacy="1.1 对床那面不露孔／1.2 变视频背景（由翻面改写）"),
  dict(id="K-E6", name="挂镜套件", applies="entry", tier="测试后", ports=[3], add=["安全镜＋重托×2"], remove=[], leftover="无", steps="重托锁入端口3 → 挂镜 → 防脱", legacy="K.8 挂镜重托"),
  dict(id="K-E7", name="换鞋坐凳", applies="entry", tier="测试后", ports=[], add=["低位块一套＋厚坐板＋坐垫"], remove=[], leftover="无", steps="低位块按床边块步骤装好 → 放在功能面旁 → A9坐板", legacy="1.1 换鞋凳 △（承人测试）"),
  dict(id="K-E8", name="脚轮底座（变移动屏3.1）", applies="entry,desk", tier="测试后", ports=[6], add=["刹车脚轮底座＋配重"], remove=["加宽底座"], leftover="加宽底座", steps="卸载 → 两人放倒 → A12换底座 → 立起锁轮", legacy="1.1 变带轮玄关车 △（动态稳定测试）"),
  # F1200 书桌旁包
  dict(id="K-D1", name="桌板套件（变带桌工作区）", applies="desk", tier="先卖", ports=[11], add=["桌板1200×600×25", "重托架×2", "钢制全高桌腿", "底部加强方管"], remove=[], leftover="无", steps="A11重托架锁入端口11 → 放桌板 → 远端立钢腿 → 锁紧", legacy="1.2 变一张桌 ✓（腿改钢腿）"),
  dict(id="K-D2", name="铝轨", applies="desk", tier="先卖", ports=[7], add=["铝轨＋支架×2"], remove=[], leftover="无", steps="支架锁入竖板内侧 → 装轨", legacy="新增（D5）"),
  dict(id="K-D3", name="显示器支架", applies="desk", tier="测试后", ports=[3], add=["显示器重托＋第三方支臂"], remove=[], leftover="无", steps="重托锁入端口3 → 装支臂；须先装桌板套件或联结第二段", legacy="K.8 显示器重托"),
  dict(id="K-D4", name="换成玄关包", applies="desk", tier="先卖", ports=[1, 2], add=["鞋斜板", "窄层板", "挂载面", "玄关配件包"], remove=["全深层板×2", "书桌旁配件包"], leftover="撤下件登记去向", steps="K-E1的逆过程", legacy="1.2 变玄关 ✓"),
  dict(id="K-D5", name="下翻站立台", applies="desk", tier="研究", ports=[], add=["下翻台面＋铰链＋支腿"], remove=[], leftover="无", steps="待4.1节点验证后定义", legacy="1.2 变站立台 △"),
  # 低位块 床边块
  dict(id="K-B1", name="叠一层（800床头柜）", applies="bedside", tier="测试后", ports=[10], add=["S400竖板×2（带跨接板）", "面板×1"], remove=[], leftover="无（台面移到新顶部）", steps="A9松开台面 → A5上层竖板跨接锁入 → A2滑入面板 → A9台面回顶", legacy="1.3 变800床头柜（D14允许）"),
  dict(id="K-B2", name="叠两层（书桌旁小柜）", applies="bedside", tier="测试后", ports=[10], add=["S400竖板×4（带跨接板）", "面板×2", "防倾固定件"], remove=[], leftover="无", steps="同K-B1两次；3层时安装固定件", legacy="1.3 变书桌旁（D14允许，≤3层）"),
  dict(id="K-B3", name="脚轮底座（沙发边桌）", applies="bedside", tier="先卖", ports=[6], add=["刹车脚轮底座"], remove=["钢脚架"], leftover="钢脚架", steps="A12换底座", legacy="1.3 变沙发边桌 ✓"),
  dict(id="K-B4", name="并排成矮柜一格", applies="bedside", tier="先卖", ports=[], add=["联结螺栓×4"], remove=[], leftover="无", steps="两块贴合 → A7锁紧", legacy="1.3 变矮柜一格 ✓"),
  dict(id="K-B5", name="抽屉或门", applies="bedside", tier="先卖", ports=[1], add=["抽屉模块或门板"], remove=[], leftover="无", steps="A15／A14", legacy="K.8 抽屉、门"),
]
# 动作词汇（原文：团队内部企划书 v3.4 动作库 A0–A17）；步骤里的 action 字段引用这里，带*表示本规格对该动作的延伸用法
ACTIONS = {"A0": "调平并建立稳定底座", "A1": "底部定位与连接", "A2": "装面板并锁定", "A3": "固定结构横板", "A4": "安装普通层板",
           "A5": "竖向加高", "A6": "安装完整顶板", "A7": "同向并联", "A8": "转角组合", "A9": "桌板与跨桥", "A10": "桌上立脚",
           "A11": "重载工作面", "A12": "更换底座或脚轮", "A13": "轻载静态挂装", "A14": "装门", "A15": "装抽屉模块",
           "A16": "装下翻工作台", "A17": "装折叠屏"}

LEGACY_RETIRED = [
  ("1.1 降到800矮台", "F整高竖板不能拆层（D3）", "历史"),
  ("1.1 变隔断的一段", "需要S叠层（D3）", "历史"),
  ("1.2 变床边块", "F不能拆层", "历史"),
  ("1.2 叠成书架", "需要S叠层或换整块竖板", "历史"),
  ("1.3 变厨房车", "S叠层可行，但厨房件与卧室件互换有卫生问题", "历史"),
]


# ---------------- 检查 ----------------
def overlap(a, b):
    return all(min(a.box[i][1], b.box[i][1]) - max(a.box[i][0], b.box[i][0]) > 0.01 for i in range(3))

def allowed_overlap(a, b):
    s = {a.id, b.id}
    ids = lambda pre: any(x.startswith(pre) for x in s)
    if ids("PNL") and (ids("SL") or ids("SR") or ids("S")) : return "面板入槽（检查入槽量）"
    if ids("CW") and ids("BASE"): return "配重在底座内"
    if ids("SHOE"): return "鞋斜板为倾斜件，包围盒近似"
    return None

def check_config(name, parts, geo):
    out = []
    boards = [p for p in parts if p.kind == "board" and p.group != "挂载面"]
    top = max(p.box[2][1] for p in parts if p.kind in ("board", "metal") and not p.id.startswith(("DESK", "BRK", "LEG", "STF")))
    out.append(f"- 整件总高：{top:.0f}（底座{geo['hb']} ＋ 竖板{geo['H']} ＋ 顶面{T}）")
    out.append(f"- 主体外形：宽{geo['W']} × 深{geo['D']}；底座深{geo['base_depth']}")
    # 干涉
    bad, allowed = [], []
    for a, b in itertools.combinations(parts, 2):
        if overlap(a, b):
            why = allowed_overlap(a, b)
            (allowed if why else bad).append((a.id, b.id, why))
    out.append(f"- 干涉：{'无' if not bad else '；'.join(f'{x}×{y}' for x, y, _ in bad)}（允许的接触 {len(allowed)} 处，如面板入槽）")
    # 入槽量
    for p in parts:
        if p.id.startswith("PNL"):
            eng = (p.size[0] - geo["iw"]) / 2
            out.append(f"- {p.name} 每侧入槽 {eng:.1f}（槽深{GD}，剩余竖板厚 {T-GD}）"); break
    return out, bad, len(boards)

def stability(name, parts, geo, D):
    m = sum((p.mass or 0) for p in parts if not p.id.startswith(("DESK", "BRK", "LEG", "STF")))
    # 重心y
    my = sum((p.mass or 0) * (p.pos[1] + p.size[1] / 2) for p in parts if not p.id.startswith(("DESK", "BRK", "LEG", "STF"))) / m
    y_edge = D - geo["base_depth"]       # 前翻边
    a = my - y_edge
    st = {k: x["value"] for k, x in P["stability"].items()}
    hang_arm = (geo["panel_front"] - 26 - st["hang_offset"]) - y_edge   # 挂物重心到前翻边（正值=在支承面内）
    M_res = m * 9.81 * a / 1000 + st["hang_load"] * 9.81 * hang_arm / 1000
    F = M_res / (st["pull_height"] / 1000)
    return dict(config=name, mass=round(m, 1), cog_y=round(my), edge_y=y_edge, F_crit=round(F), ok=F >= st["min_pull_N"])


def main():
    os.makedirs(os.path.join(HERE, "build"), exist_ok=True)
    configs = {}
    e_parts, e_ports, e_geo = entry_pack()
    d_parts, d_ports, d_geo = desk_pack()
    b_parts, b_ports, b_geo = lowblock(1)
    b2_parts, _, b2_geo = lowblock(2)
    configs["entry"] = ("1.1 玄关包（F1200，加宽底座）", e_parts, e_ports, e_geo, steps_entry())
    configs["desk"] = ("1.2 书桌旁包（F1200，加宽底座，含铝轨）", d_parts, d_ports, d_geo, steps_desk())
    configs["bedside"] = ("1.3 床边块（低位块一层）", b_parts, b_ports, b_geo, steps_bedside())
    dk = desk_kit_parts(d_geo)
    report = ["# 主样建模规格 v0 · 检查报告", "", "由 generate.py 自动生成。所有数值以 params.yaml 为准；标“假设”的参数待样件替换。", ""]
    record_counts = {"entry": 9, "desk": 9, "bedside": 5}
    model = {"version": "v0 2026-10-14", "coord": "x宽 左→右；y深 前→后；z高 地面↑；单位mm", "configs": {}, "kits": KITS,
             "retired_paths": [dict(path=a, reason=b, status=c) for a, b, c in LEGACY_RETIRED], "actions": ACTIONS, "params": P}
    cut_rows = []
    for key, (title, parts, ports, geo, steps) in configs.items():
        lines, bad, nb = check_config(title, parts, geo)
        report += [f"## {title}", ""] + lines
        report.append(f"- 结构与层板板件数：{nb}（家具记录v2.0：{record_counts[key]}）{'✓' if nb == record_counts[key] else '✗ 不一致'}；另有挂载面等非计数件")
        # 步骤覆盖：每个零件都出现在某一步
        stepped = {pid for s in steps for pid in s["parts"]}
        missing = [p.id for p in parts if p.id not in stepped]
        report.append(f"- 装配步骤 {len(steps)} 步；未出现在步骤中的零件：{'无' if not missing else '、'.join(missing)}")
        report.append("")
        model["configs"][key] = dict(title=title, geo=geo, parts=[p.to() for p in parts], ports=ports, steps=steps)
        for p in parts:
            if p.cut:
                cut_rows.append([key, p.id, p.name, p.group, p.material, *[round(c, 1) for c in p.cut], p.mass])
            else:
                cut_rows.append([key, p.id, p.name, p.group, p.material, "", "", "", p.mass])
    model["configs"]["desk"]["kit_preview"] = {"K-D1": [p.to() for p in dk]}
    # 稳定性
    report += ["## 稳定性粗算（D13校核）", "",
               "假设：前挂物10kg、重心在挂载面前80mm，1.1米高处向前水平拉；只计静力矩，不含摩擦、冲击、脚垫变形。不能代替测试。", "",
               "| 配置 | 底座 | 质量kg | 临界拉力N | 目标≥100N |", "|---|---|---|---|---|"]
    variants = [("玄关包 400深", entry_pack(400, "wide"), 400, "加宽600＋配重"),
                ("玄关包 400深", entry_pack(400, "foot"), 400, "仅400脚垫底座"),
                ("玄关包 300深（固定时）", entry_pack(300, "wide"), 300, "加宽600＋配重"),
                ("玄关包 300深", entry_pack(300, "foot"), 300, "仅300脚垫底座"),
                ("书桌旁包 400深", desk_pack(400, "wide"), 400, "加宽600＋配重")]
    for label, (pp, _, gg), D, bl in variants:
        if bl.startswith("仅"):
            pp = [p for p in pp if p.id != "CW"]
        s = stability(label, pp, gg, D)
        report.append(f"| {label} | {bl} | {s['mass']} | {s['F_crit']} | {'✓' if s['ok'] else '✗ 需固定件'} |")
    report += ["", "结论：仅靠脚垫底座时临界拉力远低于目标，D13（加宽底座＋配重，并随货附固定件）是必要条件；300深只能在固定时使用。", ""]
    # 套件
    report += ["## 加装套件与旧改造路径", "", f"- 正式套件 {len(KITS)} 个：先卖 {sum(k['tier']=='先卖' for k in KITS)}，测试后 {sum(k['tier']=='测试后' for k in KITS)}，研究 {sum(k['tier']=='研究' for k in KITS)}",
               f"- 退为历史的旧路径 {len(LEGACY_RETIRED)} 条：" + "；".join(f"{a}（{b}）" for a, b, _ in LEGACY_RETIRED), ""]
    # 端口引用检查
    port_ids = {pt["id"] for c in model["configs"].values() for pt in c["ports"]}
    bad_ports = [(k["id"], p) for k in KITS for p in k["ports"] if p not in port_ids]
    report.append(f"- 套件引用的端口均已定义：{'✓' if not bad_ports else bad_ports}")
    json.dump(model, open(os.path.join(HERE, "build", "model.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    with open(os.path.join(HERE, "build", "cutlist.csv"), "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f); w.writerow(["配置", "零件ID", "名称", "类别", "材料", "长", "宽", "厚", "质量kg"]); w.writerows(cut_rows)
    open(os.path.join(HERE, "build", "checks.md"), "w", encoding="utf-8").write("\n".join(report))
    print("\n".join(report))

if __name__ == "__main__":
    main()
