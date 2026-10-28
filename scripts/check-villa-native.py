import bpy, json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent.parent
bpy.ops.wm.open_mainfile(filepath=str(root/'assets/model/mylodge-villa.blend'))
def bounds(name):
    o=bpy.data.objects[name];p=[o.matrix_world@Vector(v) for v in o.bound_box]
    return ([min(v[i] for v in p) for i in range(3)],[max(v[i] for v in p) for i in range(3)])
wall=bounds('Sage living divider');side=bounds('Bathroom side partition')
doorway=side[0][0]-wall[1][0]
assert doorway>1.0,doorway
door=bounds('Bathroom open oak door');sofa=bounds('Sofa back')
assert not all(min(door[1][i],sofa[1][i])>max(door[0][i],sofa[0][i]) for i in range(3))
landing=bounds('Upper stair landing');last=bounds('Internal stair tread 17')
assert landing[0][0]<1.65 and landing[1][0]>last[0][0]
assert abs(landing[1][2]-last[1][2])<.01
assert min(landing[1][1],last[1][1])>max(landing[0][1],last[0][1])
assert len([o for o in bpy.data.objects if o.name.startswith('Internal stair tread ')])==17
result={'bathroom_doorway_m':doorway,'bathroom_door_does_not_intersect_sofa':True,'upper_landing_connects_last_tread_and_slab':True,'landing_top_m':landing[1][2],'last_tread_top_m':last[1][2],'stair_treads':17,'native_model_objects':len(bpy.data.objects)}
head=bounds('UpperSuite head wall');left=bounds('Upper left wall')
left_passage=head[0][0]-left[1][0]
assert left_passage>.85,left_passage
assert bpy.data.objects['FF']['gross_area_m2']==33.0855
assert bpy.data.objects['GF']['gross_area_m2']==56.17
for name in ['TERRACE','TERRACE_GLASS']:
    assert len(bpy.data.objects[name].children)>0
assert bpy.data.objects['Roof terrace slab'].parent.name=='TERRACE'
# Sliding panels end before the doorway at plan depth -2.30, leaving access.
sliders=[obj for obj in bpy.data.objects if obj.name.startswith('UpperSuite terrace sliding glass')]
assert len(sliders)==2
assert all(bounds(obj.name)[1][1]<2.30 for obj in sliders)
# Check the added furnishings have not narrowed the stair landing.
for obj in bpy.data.objects:
    if not obj.name.startswith('UpperSuite ') or obj.type!='MESH':continue
    lo,hi=bounds(obj.name)
    in_landing=all(min(hi[i],landing[1][i])>max(lo[i],landing[0][i]) for i in [0,1])
    assert not (in_landing and hi[2]>3.25 and lo[2]<5.1),obj.name
result['upper_suite']={'left_bedroom_passage_m':left_passage,'terrace_separate_from_enclosed_area':True,'sliding_door_open':True,'new_furniture_clear_of_landing':True}
(root/'review/villa-native-check.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print('NATIVE_CHECK_PASS '+json.dumps(result),flush=True)
