"""Upper-floor furnishing pass, shared by the full build and incremental refinement.

Uses model-villa.py helpers in the calling namespace. All new parts carry a
stable prefix so this pass can be reapplied without duplicating geometry.
"""
for obj in list(bpy.data.objects):
    if obj.name.startswith('UpperSuite '):
        bpy.data.objects.remove(obj, do_unlink=True)

# Keep the upstairs terrace visible independently from the downstairs envelope.
for name in ['TERRACE', 'TERRACE_GLASS']:
    if name not in groups:
        group=bpy.data.objects.get(name)
        if group is None:
            group=bpy.data.objects.new(name,None);scene.collection.objects.link(group)
        groups[name]=group;group['role']=name;group['design_stage']='concept';group['units']='metres'
for source_group,target in [('SHELL_GROUND','TERRACE'),('GLASS_GROUND','TERRACE_GLASS')]:
    for obj in list(groups[source_group].children):
        if obj.name.startswith(('Roof terrace','Terrace ','Outer terrace')) or (obj.location.x<-.75 and obj.location.z>=3.2):
            obj.parent=groups[target]

h=3.23
# The head wall makes sleeping private while keeping real walkways at both ends.
box('UpperSuite head wall',(1.42,.20,4.555),(2.25,.12,2.65),cream,'FF',.025)
box('UpperSuite sage head panel',(1.42,.127,4.60),(2.15,.025,2.45),sage,'FF',.015)
for x in [.35,2.49]:
    for i in range(4):
        box('UpperSuite head oak flute',(x+i*.035,.10,4.59),(.018,.035,2.46),oak,'FF',.005)
box('UpperSuite head light',(1.42,.11,5.79),(1.91,.025,.018),led,'FF',.003)

# Rear of the head wall becomes a useful dressing wall, facing the wardrobe.
box('UpperSuite mirror frame',(1.98,.278,4.65),(.77,.04,1.64),oak,'FF',.02)
mirror=bpy.data.materials.get('Upper suite satin mirror') or mat('Upper suite satin mirror','C5CCC8',.14,.82)
box('UpperSuite mirror face',(1.98,.303,4.65),(.71,.012,1.58),mirror,'FF',.012)
box('UpperSuite dressing ledge',(1.95,.39,3.99),(.88,.23,.055),oak,'FF',.01)
box('UpperSuite jewellery tray',(1.91,.40,4.035),(.25,.13,.025),stone,'FF',.009)

# Built-in wardrobe details, with open cubbies above the existing tall doors.
box('UpperSuite wardrobe crown',(3.66,.16,5.64),(.65,1.43,.055),oak,'FF',.012)
for z in [-.54,.16,.86]:
    box('UpperSuite wardrobe upper stile',(3.66,z,5.78),(.65,.035,.25),oak,'FF',.009)
box('UpperSuite wardrobe top',(3.66,.16,5.91),(.65,1.43,.045),oak,'FF',.01)
for z in [-.18,.50]:
    box('UpperSuite linen storage basket',(3.64,z,5.76),(.45,.46,.19),linen,'FF',.025)

# Study shelving and task light stay against the rear wall, clear of the landing.
for obj in list(groups['SHELL_UPPER'].children):
    if obj.name.startswith(('Oak picture frame','Abstract linen art','Abstract sage form','Abstract rose form')):
        bpy.data.objects.remove(obj,do_unlink=True)
for hh in [4.65,5.25]:
    box('UpperSuite study shelf',(.30,3.10,hh),(1.62,.30,.045),oak,'FF',.012)
    for x in [-.40,1.0]:
        box('UpperSuite shelf bracket',(x,3.17,hh-.08),(.025,.14,.16),metal,'FF',.005)
for i in range(7):
    box('UpperSuite study book',(-.30+i*.095,3.08,4.83),(.065,.17,.29+(i%3)*.045),[cream,sage,pink][i%3],'FF',.004)
box('UpperSuite document box',(.77,3.08,5.39),(.36,.21,.22),linen,'FF',.014)
cyl('UpperSuite desk light base',(1.0,2.86,4.08),.10,.035,metal,'FF')
rod('UpperSuite desk light stem',(1.0,2.86,4.10),(1.0,2.86,4.55),.012,metal,'FF')
rod('UpperSuite desk light arm',(1.0,2.86,4.55),(.72,2.70,4.55),.012,metal,'FF')
cyl('UpperSuite desk light shade',(.72,2.70,4.53),.10,.07,black,'FF')
cyl('UpperSuite desk light diffuser',(.72,2.70,4.49),.085,.008,led,'FF')

# Retracted linen curtains and discreet ceiling lighting soften the glass facade.
box('UpperSuite curtain track',(1.67,-3.16,5.85),(4.52,.075,.04),white,'ROOF',.012)
for center in [-.39,3.71]:
    for i in range(6):
        cyl('UpperSuite linen curtain',(center+(i-2.5)*.048,-3.12,4.56),.038,2.48,linen,'SHELL_UPPER',12)
for x,z in [(.0,-1.45),(2.98,-1.45),(.3,1.35),(2.8,2.45)]:
    cyl('UpperSuite downlight trim',(x,z,5.895),.075,.025,white,'ROOF')
    cyl('UpperSuite downlight glow',(x,z,5.88),.052,.009,led,'ROOF')
for z0,z1 in [(-1.25,3.20)]:
    box('UpperSuite left skirting',(-.557,(z0+z1)/2,3.29),(.025,z1-z0,.12),oak,'FF',.006)
box('UpperSuite rear skirting',(1.69,3.235,3.29),(4.57,.025,.12),oak,'FF',.006)

# The terrace slider is shown open: a genuine ~0.98 m opening, not a glass wall
# through which the camera has to teleport. Preserve the existing outer frame.
for obj in list(groups['GLASS_UPPER'].children):
    if obj.name.startswith('Glass panel') and abs(obj.location.x+.69)<.03:
        bpy.data.objects.remove(obj,do_unlink=True)
for x,z in [(-.69,-1.79),(-.64,-1.77)]:
    box('UpperSuite terrace sliding glass',(x,z,4.53),(.018,.94,2.28),glass,'GLASS_UPPER',.003)
    for zz in [z-.49,z+.49]:
        box('UpperSuite slider stile',(x,zz,4.53),(.045,.035,2.35),black,'SHELL_UPPER',.006)
    for hh in [3.355,5.705]:
        box('UpperSuite slider rail',(x,z,hh),(.045,1.01,.035),black,'SHELL_UPPER',.006)
rod('UpperSuite slider handle',(-.59,-2.23,4.19),(-.59,-2.23,4.43),.012,metal,'SHELL_UPPER')
box('UpperSuite terrace threshold',(-.69,-2.8,3.265),(.20,1.02,.03),stone,'TERRACE',.005)
groups['FF']['upper_suite_revision']='2026-10-28: private sleeping, study, dressing, clear landing'
groups['TERRACE']['area_basis']='open terrace, separate from the 10 pyeong enclosed upper footprint'
