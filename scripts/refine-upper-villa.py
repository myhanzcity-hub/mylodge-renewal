"""Update the editable upper suite, export GLB and render its real geometry."""
import bpy,ast,math,json,random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'assets/model'
source=(ROOT/'scripts/model-villa.py').read_text(encoding='utf-8')
bpy.ops.wm.open_mainfile(filepath=str(OUT/'mylodge-villa.blend'))
scene=bpy.context.scene;camera=scene.camera
groups={o.name:o for o in scene.objects if o.type=='EMPTY' and o.get('role')}
functions=[node for node in ast.parse(source).body if isinstance(node,ast.FunctionDef)]
exec(compile(ast.Module(body=functions,type_ignores=[]),'model-villa-functions','exec'))
for key,name in {'oak':'Oiled oak','cream':'Warm mineral plaster','white':'Porcelain white','sage':'Sage painted wall','pink':'Dusty rose cushion','linen':'Natural cream linen','metal':'Brushed brass','stone':'Sand limestone','glass':'Clear glazing','black':'Charcoal aluminium','led':'Warm light'}.items():
    globals()[key]=bpy.data.materials[name]
exec(compile((ROOT/'scripts/upper-suite-details.py').read_text(encoding='utf-8'),'upper-suite-details','exec'))
report=json.loads((ROOT/'review/villa-model-validation.json').read_text(encoding='utf-8'))
report['mesh_objects_editable']=sum(o.type=='MESH' for o in scene.objects)
report['groups']=list(groups)
report['upper_suite_revision']={'date':'2026-10-28','features':['privacy head wall','dressing mirror and storage','study shelving and task light','linen curtains and recessed lights','open terrace slider','separate terrace groups'],'nominal_gross_m2':33.0855,'terrace_excluded_from_enclosed_area':True}
(ROOT/'review/villa-model-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
for obj in scene.objects:obj.hide_render=False
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'mylodge-villa.blend'))
export=source[source.index('# Export optimized static meshes'):source.index('\ndef visibility(hidden):')]
exec(export)
scene.render.resolution_x=1400;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
scene.cycles.samples=24;scene.cycles.use_denoising=True;camera.data.type='ORTHO'
def render(name,eye,target,scale,hidden):
    for key,group in groups.items():
        for obj in group.children_recursive:obj.hide_render=key in hidden
    camera_at(eye,target,scale);scene.render.filepath=str(OUT/(name+'.png'))
    bpy.ops.render.render(write_still=True);print('RENDER_READY '+name,flush=True)
render('overview',(11,-14,12),(0,0,1.65),14.8,[])
render('upper-interior',(9,-11,14),(-.15,0,3.65),11.6,['GF','ROOF','SHELL_UPPER','GLASS_UPPER','SHELL_GROUND','GLASS_GROUND','SITE'])
print('UPPER_SUITE_COMPLETE',flush=True)
