"""Apply measured QA corrections to the editable model without rebuilding furniture."""
import bpy, ast, math, json, random
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;OUT=ROOT/'assets'/'model'
source=(ROOT/'scripts'/'model-villa.py').read_text(encoding='utf-8')
bpy.ops.wm.open_mainfile(filepath=str(OUT/'mylodge-villa.blend'))
scene=bpy.context.scene;camera=scene.camera
groups={o.name:o for o in scene.objects if o.type=='EMPTY' and o.get('role')}
functions=[node for node in ast.parse(source).body if isinstance(node,ast.FunctionDef)]
exec(compile(ast.Module(body=functions,type_ignores=[]),'model-villa-functions','exec'))
oak=bpy.data.materials['Oiled oak'];glass=bpy.data.materials['Clear glazing'];black=bpy.data.materials['Charcoal aluminium']
divider=bpy.data.objects['Sage living divider'];divider.location.x=-3.255;divider.dimensions.x=1.59
door=bpy.data.objects['Bathroom open oak door'];door.location=pos((-1.45,1.51,1.21));door.rotation_euler.z=-math.pi/2
bpy.data.objects['Mirror brass frame'].location.y=-1.17;bpy.data.objects['Mirror face'].location.y=-1.195
for o in list(groups['GF'].children):
    if o.name.startswith(('Oak picture frame','Abstract linen art')):o.location.x=-3.255
    if o.name.startswith('Abstract sage form'):o.location.x=-3.375
    if o.name.startswith('Abstract rose form'):o.location.x=-3.075
for o in list(groups['FF'].children):
    if o.name.startswith(('Oak picture frame','Abstract linen art','Abstract sage form','Abstract rose form')):o.parent=groups['SHELL_UPPER']
if 'Upper stair landing' not in bpy.data.objects:
    box('Upper stair landing',(1.685,2.47,3.19),(.53,.76,.08),oak,'FF',.01)
    for a,b in [(1.05,2.08),(2.86,3.25)]:
        box('Upper opening left guard',(1.65,(a+b)/2,3.7),(.035,b-a,.99),glass,'FF',.005)
        box('Upper opening left rail',(1.65,(a+b)/2,4.2),(.04,b-a,.04),black,'FF',.007)
        for z in [a,b]:box('Upper landing guard post',(1.65,z,3.7),(.035,.035,1.04),black,'FF',.005)
report=json.loads((ROOT/'review'/'villa-model-validation.json').read_text(encoding='utf-8'))
report['mesh_objects_editable']=sum(o.type=='MESH' for o in scene.objects)
report['qa_corrections']=['Bathroom doorway widened to approximately 1.09 m','Stair landing connects final tread to upper slab','Upper stair opening guard added with landing access gap','Mirror moved onto visible bathroom wall face','Wall art follows hidden upper shell in cutaway']
(ROOT/'review'/'villa-model-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'mylodge-villa.blend'))
exec(source[source.index('# Export optimized static meshes'):])
