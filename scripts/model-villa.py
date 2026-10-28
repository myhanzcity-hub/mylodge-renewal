"""Build the MyLodge 17 + 10 pyeong interior concept in an isolated Blender process.
Coordinates in helper functions: (x, plan depth, height), metres; front = negative depth.
The glTF export converts these to (x, height, depth), matching the web viewer.
"""
import bpy, math, random, json, os, sys
from mathutils import Vector
from pathlib import Path
random.seed(17)
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets'/'model'; OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=1
groups={}
for name in ['GF','FF','ROOF','SHELL_GROUND','SHELL_UPPER','GLASS_GROUND','GLASS_UPPER','SITE']:
    o=bpy.data.objects.new(name,None); scene.collection.objects.link(o); groups[name]=o
    o['role']=name
def linear(v):
    return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def mat(name,hex,rough=.55,metal=0,alpha=1,emission=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    color=tuple(linear(int(hex[i:i+2],16)/255) for i in (0,2,4))
    n=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    n.inputs['Base Color'].default_value=(*color,alpha); n.inputs['Roughness'].default_value=rough
    n.inputs['Metallic'].default_value=metal; n.inputs['Alpha'].default_value=alpha
    if emission:n.inputs['Emission Color'].default_value=(*color,1); n.inputs['Emission Strength'].default_value=emission
    if alpha<1:m.surface_render_method='DITHERED'
    m.diffuse_color=(*color,alpha)
    return m
cream=mat('Warm mineral plaster','E6E1D6',.82); white=mat('Porcelain white','F4F0E9',.48)
sage=mat('Sage painted wall','889681',.84); sagecloth=mat('Sage upholstery','839475',.9)
linen=mat('Natural cream linen','DDD4C2',.92); pink=mat('Dusty rose cushion','C49F93',.88)
oak=mat('Oiled oak','B88B5A',.58); walnut=mat('End grain oak','9E714A',.56)
black=mat('Charcoal aluminium','2B3230',.28,.7); metal=mat('Brushed brass','B5A075',.31,.75)
stone=mat('Sand limestone','D0C8B8',.8); grout=mat('Warm tile grout','A9A494',.9)
glass=mat('Clear glazing','CEE2DE',.12,.05,.18); showerglass=mat('Shower glazing','C5D8CF',.1,0,.24)
leaf=mat('Leaf sage','44624B',.8); leaflight=mat('Leaf olive','668259',.85)
soil=mat('Soil','534536',1); lawn=mat('Garden ground','8C9D7C',1)
led=mat('Warm light','FFE3AE',.4,0,1,3)
floor_mats=[mat('Oak plank '+str(i),c,.62) for i,c in enumerate(['C7A67F','CCAD87','C3A17A','D0B28B','BE9D76','D3B58E'])]
def pos(c):return (c[0],-c[1],c[2])
def finish(o,name,m,g):
    o.name=name; o.parent=groups[g]
    if m:o.data.materials.append(m)
    return o
def box(name,c,s,m,g='GF',bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos(c)); o=bpy.context.object; o.dimensions=s
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Soft crafted edges','BEVEL');mod.width=min(bevel,min(s)*.43);mod.segments=3
        bpy.ops.object.modifier_apply(modifier=mod.name)
        for f in o.data.polygons:f.use_smooth=True
        mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');mod.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,name,m,g)
def cyl(name,c,r,h,m,g='GF',vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=h,location=pos(c));o=bpy.context.object
    for f in o.data.polygons:f.use_smooth=True
    return finish(o,name,m,g)
def sphere(name,c,s,m,g='GF'):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=1,location=pos(c));o=bpy.context.object;o.scale=s
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for f in o.data.polygons:f.use_smooth=True
    return finish(o,name,m,g)
def rod(name,a,b,r,m,g='GF'):
    aa,bb=Vector(pos(a)),Vector(pos(b));o=cyl(name,(0,0,0),r,(bb-aa).length,m,g,12)
    o.location=(aa+bb)/2;o.rotation_euler=(bb-aa).to_track_quat('Z','Y').to_euler();return o
def path_curve(name,points,r,m,g):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=r;curve.bevel_resolution=2
    poly=curve.splines.new('POLY');poly.points.add(len(points)-1)
    for v,p in zip(poly.points,points):v.co=(*pos(p),1)
    o=bpy.data.objects.new(name,curve);scene.collection.objects.link(o);o.parent=groups[g];o.data.materials.append(m)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o
def plant(name,x,z,h,g='GF',scale=1):
    cyl(name+' pot',(x,z,h+.15*scale),.19*scale,.3*scale,stone,g)
    cyl(name+' soil',(x,z,h+.303*scale),.17*scale,.015,soil,g)
    for i in range(9):
        a=i*2.4;hh=(.55+random.random()*.38)*scale
        end=(x+math.cos(a)*.3*scale,z+math.sin(a)*.3*scale,h+hh)
        rod(name+' stem',(x,z,h+.3*scale),end,.009*scale,leaf,g)
        o=sphere(name+' leaf',end,(.10*scale,.23*scale,.035*scale),leaf if i%2 else leaflight,g)
        o.rotation_euler=(.3,random.random()*.8,a)
def books(x,z,h,g='GF'):
    for i,(w,d,c) in enumerate([(.27,.19,cream),(.24,.17,sage),(.26,.18,pink)]):box('Stacked book',(x,z,h+i*.032),(w,d,.03),c,g,.005)
def cup(x,z,h,g='GF'):
    cyl('Ceramic coffee cup',(x,z,h+.045),.04,.09,white,g)
    cyl('Coffee',(x,z,h+.091),.032,.002,walnut,g)
def chair(x,z,h=0,g='GF',angle=0):
    parts=[]
    for dx in [-.22,.22]:
        for dz in [-.22,.22]:parts.append(box('Chair oak leg',(x+dx,z+dz,h+.24),(.045,.045,.46),oak,g,.015))
    parts.append(box('Chair padded seat',(x,z,h+.49),(.52,.53,.12),linen,g,.06))
    parts.append(box('Chair curved back',(x,z+.24,h+.78),(.53,.085,.48),linen,g,.04))
    if angle:
        for o in parts:
            vx,vz=o.location.x-x,-o.location.y-z
            o.location.x=x+vx*math.cos(angle)-vz*math.sin(angle)
            o.location.y=-(z+vx*math.sin(angle)+vz*math.cos(angle));o.rotation_euler.z=-angle
def rug(x,z,h,w,d,g='GF'):
    box('Woven area rug',(x,z,h),(w,d,.025),linen,g,.01)
    for i in range(int(d/.1)):
        box('Rug fine woven rib',(x,z-d/2+i*.1,h+.015),(w,.012,.006),stone,g,.002)
def wallart(x,z,h,g='GF',w=.8):
    box('Oak picture frame',(x,z,h),(w,.055,.9),oak,g,.015)
    box('Abstract linen art',(x,z-.032,h),(w-.06,.012,.84),cream,g,.002)
    sphere('Abstract sage form',(x-.12,z-.048,h+.05),(.22,.009,.28),sage,g)
    sphere('Abstract rose form',(x+.18,z-.05,h-.16),(.16,.008,.19),pink,g)
def cabinet(x,z,w,g='GF',h=.15):
    box('Kitchen oak base',(x,z,h+.4),(w,.61,.8),oak,g)
    for i in range(max(1,round(w/.55))):
        n=max(1,round(w/.55));xx=x-w/2+(i+.5)*w/n
        box('Kitchen cream door',(xx,z-.317,h+.4),(w/n-.025,.025,.72),white,g,.009)
        box('Brass door pull',(xx+w/n*.25,z-.341,h+.57),(.018,.025,.14),metal,g,.004)
    box('Limestone countertop',(x,z,h+.835),(w+.025,.66,.065),stone,g,.02)
def frame_window(x,z,w,h,base,g,side=False):
    dims=(.07,w,h) if side else (w,.07,h)
    glassdims=(.025,w-.12,h-.12) if side else (w-.12,.025,h-.12)
    shell='SHELL_UPPER' if 'UPPER' in g else 'SHELL_GROUND'
    box('Glass panel',(x,z,base+h/2),glassdims,glass,g,.004)
    for a in [-w/2,w/2]:box('Aluminium window mullion',(x if side else x+a,z+a if side else z,base+h/2),(.07,.07,h),black,shell,.012)
    for hh in [base,base+h]:box('Aluminium window rail',(x,z,hh),(.07,w,.07) if side else (w,.07,.07),black,shell,.012)

# Exact gross slabs: 56.17 m2 ground; 33.0855 m2 upper, before wall/stair deductions.
slab=box('Ground_Slab_8.20x6.85',(0,0,.05),(8.2,6.85,.20),stone,'GF',.025)
slab['gross_area_m2']=56.17
def floorplanks(x0,x1,z0,z1,h,g):
    rows=math.ceil((x1-x0)/.205)
    for i in range(rows):
        x=x0+(i+.5)*(x1-x0)/rows
        for j in range(4):
            a=z0+j*(z1-z0)/4;b=z0+(j+1)*(z1-z0)/4
            box('Oak floor board',(x,(a+b)/2,h),((x1-x0)/rows-.004,b-a-.005,.025),floor_mats[(i+j)%6],g,.003)
floorplanks(-4.02,4.02,-3.34,3.34,.163,'GF')
upper_parts=[(-.73,1.65,-3.425,3.425),(3.85,4.1,-3.425,3.425),(1.65,3.85,-3.425,1.05),(1.65,3.85,3.25,3.425)]
for i,(x0,x1,z0,z1) in enumerate(upper_parts):
    o=box('Upper_Slab_Part_'+str(i),((x0+x1)/2,(z0+z1)/2,3.1),(x1-x0,z1-z0,.2),cream,'FF',.015)
    o['nominal_upper_gross_area_m2']=33.0855
    floorplanks(x0+.02,x1-.02,z0+.02,z1-.02,3.213,'FF')
box('Roof terrace slab',(-2.415,0,3.1),(3.37,6.85,.2),stone,'SHELL_GROUND',.08)
for i in range(18):box('Terrace decking',(-2.415,-3.325+i*.385,3.225),(3.25,.375,.05),floor_mats[i%6],'SHELL_GROUND',.01)
box('Ground rear wall',(0,3.34,1.59),(8.2,.17,2.88),cream,'SHELL_GROUND',.05)
box('Ground left rear wall',(-4.02,2.2,1.59),(.16,2.45,2.88),cream,'SHELL_GROUND')
box('Ground right rear wall',(4.02,2.2,1.59),(.16,2.45,2.88),cream,'SHELL_GROUND')
for x in [-4.02,4.02]:box('Ground corner post',(x,-3.34,1.59),(.16,.18,2.88),cream,'SHELL_GROUND',.05)
for i in range(4):frame_window(-3.015+i*2.01,-3.36,2.01,2.55,.25,'GLASS_GROUND')
for x in [-4.035,4.035]:frame_window(x,-1.2,4.22,2.55,.25,'GLASS_GROUND',True)
box('Rounded upper rear wall',(1.685,3.34,4.565),(4.83,.18,2.75),cream,'SHELL_UPPER',.08)
box('Upper left wall',(-.65,1.0,4.565),(.16,4.6,2.75),sage,'SHELL_UPPER',.04)
for x in [-.66,4.02]:box('Upper front corner',(x,-3.34,4.565),(.16,.18,2.75),white,'SHELL_UPPER',.07)
for i in range(2):frame_window(.49+i*2.35,-3.36,2.35,2.45,3.33,'GLASS_UPPER')
frame_window(4.04,-.48,5.7,2.45,3.33,'GLASS_UPPER',True)
frame_window(-.69,-2.29,2.06,2.4,3.33,'GLASS_UPPER',True)
box('Soft white roof',(1.685,0,6.02),(5.02,7.02,.23),white,'ROOF',.11)
box('Ground front fascia',(0,-3.43,3.09),(8.4,.22,.24),white,'SHELL_GROUND',.1)
box('Upper front fascia',(1.685,-3.43,5.96),(5.02,.22,.26),white,'ROOF',.11)
for z in [-3.33,3.33]:
    for x in [-4.04,-2.4,-.77]:box('Terrace guard post',(x,z,3.77),(.035,.035,1.1),black,'SHELL_GROUND',.006)
    box('Terrace guardrail',(-2.415,z,4.31),(3.35,.04,.04),black,'SHELL_GROUND',.008)
    box('Terrace glass balustrade',(-2.415,z,3.76),(3.28,.018,1.04),glass,'GLASS_GROUND',.003)
for z in [-3.33,0,3.33]:box('Outer terrace guard post',(-4.04,z,3.77),(.04,.04,1.1),black,'SHELL_GROUND',.008)
box('Outer terrace rail',(-4.04,0,4.31),(.04,6.7,.04),black,'SHELL_GROUND',.008)
box('Outer terrace glass',(-4.04,0,3.76),(.018,6.6,1.04),glass,'GLASS_GROUND',.003)
for i in range(10):box('Front timber screen',(3.62+i*.045,-3.48,1.62),(.026,.13,2.85),oak,'SHELL_GROUND',.009)

# Living room: 2.5 m low sofa, lounge chair, woven rug, media wall and soft accessories.
rug(-2.2,-1.05,.19,3.35,3.25)
box('Sofa upholstered base',(-2.45,-.1,.43),(2.62,.95,.43),linen,bevel=.15)
box('Sofa back',(-2.45,.25,.89),(2.62,.22,.77),linen,bevel=.1)
for x in [-3.68,-1.22]:box('Sofa arm',(x,-.09,.7),(.22,.97,.58),linen,bevel=.1)
for i in range(3):box('Sofa seat cushion',(-3.25+i*.8,-.22,.68),(.77,.72,.17),white,bevel=.08)
for x,m in [(-3.35,sagecloth),(-1.55,pink)]:
    o=box('Linen accent cushion',(x,.03,.99),(.46,.16,.43),m,bevel=.08);o.rotation_euler.x=-.16
cyl('Oak round coffee tabletop',(-2.45,-1.5,.59),.52,.085,oak)
cyl('Coffee table pedestal',(-2.45,-1.5,.37),.19,.39,walnut)
books(-2.48,-1.55,.64);cup(-2.15,-1.45,.64)
chair(-.85,-2.35,angle=-.9)
box('Low media console',(-3.8,-1.6,.46),(.36,1.9,.55),oak)
box('Media panel',(-3.79,-1.6,1.21),(.045,1.25,.74),black)
plant('Living olive',-3.6,-2.95,.19,scale=1.2)
wallart(-3.255,1.0,1.95,w=1.1)
box('Sage living divider',(-3.255,1.08,1.58),(1.59,.12,2.85),sage,bevel=.02)

# Kitchen cabinetry and appliances, scaled around 2.6 m of worktop.
cabinet(.12,2.93,2.55)
box('Kitchen backsplash',(.12,3.23,1.36),(2.7,.025,.58),stone,bevel=.005)
for x in [-.72,.15,1.02]:
    box('Wall cabinet',(x,3.05,2.2),(.82,.38,.72),white,bevel=.015)
    box('Under cabinet glow',(x,2.88,1.83),(.72,.025,.018),led,bevel=.005)
box('Sink steel rim',(-.65,2.9,1.018),(.52,.39,.012),black,bevel=.04)
box('Sink inside',(-.65,2.9,1.024),(.41,.28,.01),stone,bevel=.04)
path_curve('Kitchen mixer faucet',[(-.65,3.12,1.02),(-.65,3.12,1.31),(-.65,3.04,1.39),(-.65,2.94,1.37),(-.65,2.91,1.27)],.016,metal,'GF')
box('Induction hob',(.74,2.9,1.021),(.58,.43,.018),black,bevel=.02)
for x in [.57,.92]:cyl('Hob burner',(x,2.9,1.032),.105,.004,grout)
box('Under counter refrigerator',(.97,2.61,.55),(.55,.03,.73),black,bevel=.012)
box('Fridge handle',(1.16,2.58,.74),(.02,.025,.23),metal,bevel=.005)
box('Open oak shelf',(-.58,2.97,1.66),(1.25,.31,.045),oak,bevel=.01)
for i in range(4):cyl('Kitchen ceramic jar',(-.95+i*.22,2.92,1.77),.065,.17,white)
plant('Kitchen herb',.65,2.94,1.05,scale=.45)
box('Dining oak tabletop',(1.65,-1.2,.95),(1.65,.9,.09),oak,bevel=.045)
for x in [1.0,2.3]:
    for z in [-1.53,-.87]:box('Dining table leg',(x,z,.56),(.065,.065,.74),walnut,bevel=.018)
for x in [1.17,2.12]:chair(x,-1.98,.18,angle=math.pi);chair(x,-.42,.18)
for x in [1.17,2.12]:
    cyl('Dining plate',(x,-1.2,1.005),.16,.014,white);cup(x+.19,-1.35,1.008)
cyl('Dining vase',(1.65,-1.2,1.13),.065,.25,stone)
rod('Flower stem',(1.65,-1.2,1.24),(1.67,-1.22,1.5),.006,leaf)
sphere('Dried floral head',(1.67,-1.22,1.5),(.13,.07,.1),pink)
for x in [1.24,2.07]:
    rod('Pendant cord',(x,-1.2,2.93),(x,-1.2,2.18),.009,black)
    sphere('Opal pendant',(x,-1.2,2.1),(.18,.18,.2),white)
    cyl('Pendant warm diffuser',(x,-1.2,1.99),.11,.01,led)

# Bathroom envelope, door opening and individual sanitary fixtures.
box('Bathroom side partition',(-1.31,2.22,1.58),(.12,2.4,2.85),cream)
box('Bathroom door lintel',(-1.91,1.08,2.65),(1.1,.12,.7),cream)
door=box('Bathroom open oak door',(-1.45,1.51,1.21),(.86,.045,2.12),oak);door.rotation_euler.z=-math.pi/2
for i in range(5):
    for j in range(4):box('Bathroom floor tile',(-3.73+i*.5,1.45+j*.51,.194),(.49,.5,.025),stone,bevel=.004)
box('Shower tray',(-3.42,2.66,.24),(1.03,1.1,.1),white,bevel=.035)
box('Shower glass front',(-3.42,2.1,1.28),(1.04,.018,2.0),showerglass,bevel=.003)
box('Shower glass side',(-2.88,2.66,1.28),(.018,1.1,2.0),showerglass,bevel=.003)
for x in [-3.95,-2.88]:box('Shower frame',(x,2.1,1.28),(.028,.028,2.03),black,bevel=.004)
rod('Shower column',(-3.44,3.18,.85),(-3.44,3.18,2.36),.018,black)
rod('Shower arm',(-3.44,3.18,2.36),(-3.44,2.87,2.36),.016,black)
cyl('Rain shower head',(-3.44,2.87,2.34),.13,.025,black)
box('Bathroom vanity',(-3.39,1.4,.63),(.92,.48,.52),oak)
box('Vanity counter',(-3.39,1.4,.91),(.96,.51,.06),stone)
sphere('Ceramic basin',(-3.39,1.4,.985),(.32,.19,.095),white)
box('Mirror brass frame',(-3.39,1.17,1.61),(.82,.032,.79),metal,bevel=.04)
box('Mirror face',(-3.39,1.195,1.61),(.76,.014,.73),glass,bevel=.025)
box('Toilet cistern',(-2.08,3.13,.72),(.39,.24,.59),white,bevel=.07)
sphere('Toilet bowl',(-2.08,2.79,.51),(.24,.32,.27),white)
sphere('Toilet seat',(-2.08,2.76,.72),(.25,.32,.045),white)
rod('Towel rail',(-1.4,1.9,1.25),(-1.4,2.55,1.25),.017,black)
box('Folded bathroom towel',(-1.44,2.23,1.08),(.05,.42,.35),linen,bevel=.01)

# Internal spiral: 17 risers, 3.05 m rise; upper slab has a real opening.
cx,cz=2.75,2.15; rise=3.05/17
cyl('Stair central column',(cx,cz,1.75),.065,3.2,black)
hand=[]
for i in range(17):
    a=-math.pi*.8+i*math.pi*1.8/17;b=a+math.pi*1.8/17;hh=.18+(i+1)*rise
    verts=[]
    for height in [hh-.065,hh]:
        for j in range(6):
            angle=a+(b-a)*j/5
            verts.append(pos((cx+math.cos(angle)*.96,cz+math.sin(angle)*.96,height)))
        verts.append(pos((cx,cz,height)))
    faces=[tuple(range(6,-1,-1)),tuple(range(7,14))]
    for k in range(7):faces.append((k,(k+1)%7,(k+1)%7+7,k+7))
    mesh=bpy.data.meshes.new('Wedge tread');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('Internal stair tread '+str(i+1),mesh);scene.collection.objects.link(o);finish(o,o.name,oak,'GF')
    px,pz=cx+math.cos(b)*.92,cz+math.sin(b)*.92
    rod('Stair baluster',(px,pz,hh),(px,pz,hh+.88),.013,black)
    hand.append((px,pz,hh+.9))
path_curve('Continuous spiral handrail',hand,.025,oak,'GF')
for z in [1.04,3.27]:
    box('Upper opening guard',(2.75,z,3.7),(2.2,.035,.99),glass,'FF',.005)
    box('Upper opening rail',(2.75,z,4.2),(2.2,.04,.04),black,'FF',.007)
box('Upper opening right guard',(3.86,2.15,3.7),(.035,2.2,.99),glass,'FF',.005)
box('Upper stair landing',(1.685,2.47,3.19),(.53,.76,.08),oak,'FF',.01)
for a,b in [(1.05,2.08),(2.86,3.25)]:
    box('Upper opening left guard',(1.65,(a+b)/2,3.7),(.035,b-a,.99),glass,'FF',.005)
    box('Upper opening left rail',(1.65,(a+b)/2,4.2),(.04,b-a,.04),black,'FF',.007)
    for z in [a,b]:box('Upper landing guard post',(1.65,z,3.7),(.035,.035,1.04),black,'FF',.005)

# Upper suite: sleeping, reading, work and storage, all separate meshes.
h=3.23
rug(1.37,-1.38,h+.02,3.7,3.5,'FF')
box('Upholstered bed foundation',(1.42,-1.2,h+.22),(1.72,2.12,.35),oak,'FF',.09)
box('Linen mattress',(1.42,-1.2,h+.48),(1.62,2.02,.25),white,'FF',.11)
box('Oak upholstered headboard',(1.42,-.1,h+.7),(1.9,.13,1.2),sagecloth,'FF',.06)
box('Soft ivory duvet',(1.42,-1.52,h+.64),(1.65,1.46,.13),linen,'FF',.09)
box('Sage woven throw',(1.42,-2.04,h+.72),(1.68,.46,.055),sagecloth,'FF',.02)
for x in [1.02,1.82]:box('Bedroom pillow',(x,-.47,h+.7),(.66,.43,.17),white,'FF',.08)
for x in [.18,2.65]:
    box('Bedside floating oak shelf',(x,-.32,h+.51),(.47,.42,.12),oak,'FF')
    cyl('Bedside lamp base',(x,-.32,h+.6),.07,.06,metal,'FF')
    cyl('Bedside lamp stem',(x,-.32,h+.75),.015,.25,metal,'FF')
    sphere('Bedside opal globe',(x,-.32,h+.91),(.12,.12,.14),white,'FF')
books(.18,-.34,h+.59,'FF')
box('Compact work desk',(.35,2.69,h+.76),(1.6,.65,.065),oak,'FF')
for x in [-.3,1.0]:box('Desk slim leg',(x,2.7,h+.38),(.06,.5,.73),oak,'FF')
chair(.35,1.97,h,'FF')
box('Laptop base',(.38,2.65,h+.81),(.39,.28,.018),black,'FF',.006)
laptop=box('Laptop screen',(.38,2.8,h+.95),(.39,.018,.26),black,'FF',.006);laptop.rotation_euler.x=.15
plant('Desk plant',-.25,2.68,h+.81,'FF',.45);cup(.92,2.67,h+.81,'FF')
for z in [-.18,.5]:
    box('Full height oak wardrobe',(3.67,z,h+1.15),(.62,.66,2.3),oak,'FF')
    box('Wardrobe sage door',(3.34,z,h+1.15),(.025,.63,2.26),sage,'FF',.01)
    box('Wardrobe brass pull',(3.31,z-.15,h+1.17),(.03,.018,.24),metal,'FF',.005)
chair(.05,-2.56,h,'FF',-.4);plant('Bedroom plant',3.47,-2.8,h,'FF',1.0)
wallart(.25,3.22,h+1.75,'SHELL_UPPER',.95)
box('Low reading bookshelf',(-.38,.59,h+.39),(.38,1.2,.75),oak,'FF')
for i in range(8):box('Shelf book',(-.38,.08+i*.13,h+.43),(.27,.075,.35+random.random()*.12),[cream,pink,sage][i%3],'FF',.003)

# Compact terrace, entry and planting form a restrained context.
chair(-2.8,-1.4,3.25,'SHELL_GROUND',.4);chair(-1.5,-1.4,3.25,'SHELL_GROUND',-.4)
cyl('Terrace bistro table',(-2.15,-2.0,3.85),.34,.055,oak,'SHELL_GROUND')
cyl('Terrace table stem',(-2.15,-2,3.56),.07,.55,black,'SHELL_GROUND');cup(-2.15,-2,3.88,'SHELL_GROUND')
plant('Terrace planter',-3.55,2.65,3.25,'SHELL_GROUND',1.0)
box('Site podium',(0,0,-.25),(11.8,10.5,.35),stone,'SITE',.16)
box('Entry oak deck',(0,-4.03,.03),(8.2,1.15,.16),oak,'SITE',.025)
for i in range(3):box('Entry low step '+str(i),(0,-4.55-i*.28,-.04-i*.07),(2.3,.3,.12),stone,'SITE',.02)
for x in [-5.0,5.0]:
    box('Raised garden strip',(x,.1,-.02),(1.05,8.5,.15),lawn,'SITE',.16)
    for z in [-3,-1.5,.2,1.8,3.3]:plant('Garden planting',x,z,.05,'SITE',.8+random.random()*.4)
for z in [4.45]:
    box('Rear garden strip',(0,z,-.02),(10.8,.8,.15),lawn,'SITE',.16)
    for x in [-4.4,-2.2,0,2.2,4.4]:plant('Rear planting',x,z,.05,'SITE',.8)

# Shared upper-floor architecture and furnishing pass.
exec(compile((ROOT/'scripts/upper-suite-details.py').read_text(encoding='utf-8'),'upper-suite-details','exec'))

# Lighting and cameras are retained in the editable native file, excluded from GLB.
world=bpy.data.worlds.new('Soft studio daylight');scene.world=world;world.use_nodes=True
world.node_tree.nodes.get('Background').inputs[0].default_value=(.68,.75,.83,1)
world.node_tree.nodes.get('Background').inputs[1].default_value=.45
def area(name,location,energy,size,target):
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=pos(location);o.rotation_euler=(Vector(pos(target))-o.location).to_track_quat('-Z','Y').to_euler()
area('Large soft daylight',(-5,-7,11),1700,8,(0,0,0))
area('Interior fill',(6,-4,8),1100,7,(0,0,2))
area('Warm rear bounce',(0,6,9),1500,6,(0,0,1))
sun_data=bpy.data.lights.new('Morning sun','SUN');sun_data.energy=2;sun_data.angle=.16
sun=bpy.data.objects.new('Morning sun',sun_data);scene.collection.objects.link(sun);sun.rotation_euler=(.5,-.45,-.4)
bpy.ops.object.camera_add(location=pos((12,-15,13)));camera=bpy.context.object;camera.name='Presentation camera';scene.camera=camera
camera.data.type='ORTHO';camera.data.ortho_scale=15
def camera_at(eye,target,scale):
    camera.location=pos(eye);camera.rotation_euler=(Vector(pos(target))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
try:scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
except:scene.render.engine='BLENDER_EEVEE_NEXT'
scene.render.resolution_x=1400;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.view_settings.view_transform='AgX'

objects=[o for o in scene.objects if o.type=='MESH']
report={'unit':'metre','ground':{'width':8.2,'depth':6.85,'gross_m2':56.17,'pyeong':56.17/3.305785},'upper':{'width':4.83,'depth':6.85,'gross_m2':33.0855,'pyeong':33.0855/3.305785,'floor_height':3.2,'stair_opening':[1.65,3.85,1.05,3.25]},'total_gross_m2':89.2555,'mesh_objects_editable':len(objects),'stair_treads':17,'groups':list(groups),'design':'Concept model. Gross outer dimensions; not certified construction drawings.','reference_pdf_pages':[21,22,27],'rooms':['living','kitchen','dining','bathroom','internal stair','bedroom','desk','wardrobe','terrace']}
(ROOT/'review'/'villa-model-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
for g in groups.values():g['design_stage']='concept';g['units']='metres'
groups['GF']['gross_area_m2']=56.17;groups['FF']['gross_area_m2']=33.0855
camera_at((11,-14,12),(0,0,1.8),14.8)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'mylodge-villa.blend'))

# Export optimized static meshes; retain named, separate parent roots for cutaways.
# Joining by material inside each root reduces browser draw calls without flattening floors.
for group in groups.values():
    buckets={}
    for o in list(group.children):
        if o.type=='MESH':buckets.setdefault(o.active_material.name if o.active_material else 'none',[]).append(o)
    for key,bucket in buckets.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in bucket:o.select_set(True)
        bpy.context.view_layer.objects.active=bucket[0]
        if len(bucket)>1:bpy.ops.object.join()
        bpy.context.object.name=group.name+'__'+key.replace(' ','_')
bpy.ops.object.select_all(action='DESELECT')
for g in groups.values():
    g.select_set(True)
    for child in g.children_recursive:child.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'mylodge-villa.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False)
print('MODEL_READY '+json.dumps(report),flush=True)

def visibility(hidden):
    for name,g in groups.items():
        for o in g.children_recursive:o.hide_render=name in hidden
def render(name,eye,target,scale,hidden):
    visibility(hidden);camera_at(eye,target,scale);scene.render.filepath=str(OUT/(name+'.png'))
    bpy.ops.render.render(write_still=True);print('RENDER_READY '+name,flush=True)
render('overview',(11,-14,12),(0,0,1.65),14.8,[])
render('ground-interior',(9,-11,13),(0,0,.7),12.1,['FF','ROOF','SHELL_UPPER','GLASS_UPPER','SHELL_GROUND','GLASS_GROUND','TERRACE','TERRACE_GLASS'])
render('upper-interior',(9,-11,14),(-.15,0,3.65),11.6,['GF','ROOF','SHELL_UPPER','GLASS_UPPER','SHELL_GROUND','GLASS_GROUND','SITE'])
render('living-interior',(-1.0,-4.7,3.3),(-2.2,-.1,.9),5.7,['FF','ROOF','SHELL_UPPER','GLASS_UPPER','SHELL_GROUND','GLASS_GROUND','SITE','TERRACE','TERRACE_GLASS'])
visibility([])
print('COMPLETE',flush=True)
