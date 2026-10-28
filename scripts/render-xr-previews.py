import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent.parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/model/mylodge-villa.blend'))
scene=bpy.context.scene;camera=scene.camera
camera.data.type='PERSP';camera.data.lens=18.75;camera.data.sensor_width=36
scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.view_settings.exposure=.35
world=scene.world;tree=world.node_tree
background=next(n for n in tree.nodes if n.type=='BACKGROUND')
env=tree.nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(ROOT/'assets/environment/forest-slope-1k.hdr'))
tree.links.new(env.outputs['Color'],background.inputs['Color']);background.inputs['Strength'].default_value=.6
# Use the HDR for illumination only, matching the viewer's plain blue backdrop.
blue=tree.nodes.new('ShaderNodeBackground')
def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
blue.inputs['Color'].default_value=(*(linear(v/255) for v in [139,174,201]),1)
blue.inputs['Strength'].default_value=1
light_path=tree.nodes.new('ShaderNodeLightPath');mix=tree.nodes.new('ShaderNodeMixShader')
camera_or_transmission=tree.nodes.new('ShaderNodeMath');camera_or_transmission.operation='MAXIMUM'
tree.links.new(light_path.outputs['Is Camera Ray'],camera_or_transmission.inputs[0])
tree.links.new(light_path.outputs['Is Transmission Ray'],camera_or_transmission.inputs[1])
tree.links.new(camera_or_transmission.outputs[0],mix.inputs[0])
tree.links.new(background.outputs[0],mix.inputs[1]);tree.links.new(blue.outputs[0],mix.inputs[2])
tree.links.new(mix.outputs[0],next(n for n in tree.nodes if n.type=='OUTPUT_WORLD').inputs['Surface'])
for obj in scene.objects:
    if obj.type=='LIGHT' and obj.data.type=='AREA':obj.data.energy*=.4
def convert(p):return Vector((p[0],-p[2],p[1]))
for name,point,watts in [('Living soft ceiling',[-2.3,2.9,-.6],210),('Kitchen soft ceiling',[.1,2.9,2.4],170),('Dining soft ceiling',[1.65,2.9,-1.2],160),('Bath soft ceiling',[-2.7,2.9,2.1],90),('Bedroom soft ceiling',[1.4,5.8,-1.1],230),('Study soft ceiling',[.3,5.8,2.3],170),('Dressing soft ceiling',[2.8,5.8,.55],100)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=watts;data.shape='DISK';data.size=2.0
    light=bpy.data.objects.new(name,data);scene.collection.objects.link(light);light.location=convert(point)
    light.rotation_euler=(0,0,0)
poses={'xr-living':([-.35,1.72,-2.7],[-2.3,1.2,-.1]),'xr-bedroom':([2.85,4.78,-2.85],[1.4,4.05,-.1])}
if '--upper-suite' in sys.argv or '--study-only' in sys.argv:
    poses={'xr-bedroom':poses['xr-bedroom'],'xr-study':([.85,4.78,.85],[.35,4.15,2.7])}
if '--study-only' in sys.argv:
    poses={'xr-study':poses['xr-study']}
    scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.cycles.samples=16
if '--living-only' in sys.argv:
    poses={'xr-living':poses['xr-living']}
    scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.cycles.samples=16
for name,(eye,target) in poses.items():
    camera.location=convert(eye);camera.rotation_euler=(convert(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str((ROOT/'review' if name=='xr-study' else ROOT/'assets/model')/f'{name}.png')
    bpy.ops.render.render(write_still=True);print('XR_PREVIEW_READY '+name,flush=True)
