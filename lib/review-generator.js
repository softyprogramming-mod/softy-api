// Shared review generator (copied from google-apps-script.js)

const OPENING_SENTENCES = [
  '{DIRECTOR} brings us {TITLE}, a {GENRE_ADJ} exploration',
  'In {TITLE}, director {DIRECTOR} crafts a {GENRE_ADJ} narrative',
  '{TITLE} marks {DIRECTOR} as a filmmaker with a distinct voice',
  'Director {DIRECTOR} presents {TITLE}, a compelling study',
  'With {TITLE}, {DIRECTOR} delivers a {GENRE_ADJ} work',
  '{DIRECTOR}\'s {TITLE} is a {GENRE_ADJ} achievement',
  'In this {GENRE_ADJ} work, {DIRECTOR} explores',
  '{TITLE} showcases {DIRECTOR}\'s talent for {GENRE_ADJ} storytelling',
  'Director {DIRECTOR}\'s {TITLE} is a confident exploration',
  '{DIRECTOR} demonstrates remarkable control in {TITLE}',
  'Through {TITLE}, {DIRECTOR} examines',
  '{TITLE} is a {GENRE_ADJ} film that resonates',
  '{DIRECTOR} brings a fresh perspective to {GENRE} with {TITLE}',
  'In {TITLE}, {DIRECTOR} weaves together',
  '{TITLE} represents {DIRECTOR}\'s unique approach to {GENRE}',
  'Director {DIRECTOR} crafts something special with {TITLE}',
  '{TITLE} announces {DIRECTOR} as a voice worth following',
  'With {TITLE}, {DIRECTOR} proves adept at {GENRE_ADJ} filmmaking',
  '{DIRECTOR}\'s {TITLE} stands out for its {QUALITY}',
  'In this {GENRE_ADJ} short, {DIRECTOR} delivers',
  '{TITLE} finds {DIRECTOR} in complete command',
  'Director {DIRECTOR} shows maturity beyond expectations in {TITLE}',
  '{TITLE} marks an impressive {GENRE} entry from {DIRECTOR}',
  'Through {TITLE}, director {DIRECTOR} demonstrates',
  '{DIRECTOR} brings authentic vision to {TITLE}',
  'In {TITLE}, {DIRECTOR} balances {QUALITY} with {QUALITY}',
  '{TITLE} showcases {DIRECTOR}\'s keen eye for',
  'Director {DIRECTOR}\'s {TITLE} is a testament to',
  'With {TITLE}, {DIRECTOR} establishes a distinctive style',
  '{TITLE} reflects {DIRECTOR}\'s commitment to',
  'In this {GENRE_ADJ} work, {DIRECTOR} navigates',
  '{DIRECTOR} creates a powerful statement with {TITLE}',
  '{TITLE} finds strength in {DIRECTOR}\'s {QUALITY}',
  'Director {DIRECTOR} approaches {GENRE} with fresh eyes in {TITLE}',
  'Through {TITLE}, {DIRECTOR} invites viewers to',
  '{TITLE} demonstrates {DIRECTOR}\'s understanding of',
  '{DIRECTOR} delivers assured filmmaking with {TITLE}',
  'In {TITLE}, director {DIRECTOR} builds',
  '{TITLE} marks {DIRECTOR} as a filmmaker to watch',
  'Director {DIRECTOR}\'s {TITLE} operates on multiple levels',
  'With {TITLE}, {DIRECTOR} captures something essential',
  '{TITLE} reveals {DIRECTOR}\'s talent for',
  'In this {GENRE_ADJ} piece, {DIRECTOR} explores',
  '{DIRECTOR} shows remarkable restraint in {TITLE}',
  '{TITLE} finds {DIRECTOR} working at the height of creativity',
  'Director {DIRECTOR} brings intelligence to {TITLE}',
  'Through {TITLE}, {DIRECTOR} examines the complexities of',
  '{TITLE} is a {GENRE_ADJ} film that lingers',
  '{DIRECTOR} demonstrates cinematic maturity with {TITLE}',
  'In {TITLE}, {DIRECTOR} creates a world that feels',
  '{DIRECTOR} approaches {TITLE} as a {GENRE_ADJ} exercise',
  'With {TITLE}, {DIRECTOR} offers a {GENRE_ADJ} perspective',
  '{TITLE} finds {DIRECTOR} working within the {GENRE} tradition',
  'In {TITLE}, {DIRECTOR} pursues a {GENRE_ADJ} approach',
  '{DIRECTOR} situates {TITLE} firmly in the realm of {GENRE}',
  '{TITLE} presents {DIRECTOR} at a moment of creative focus',
  '{DIRECTOR} uses {TITLE} as a vehicle for {QUALITY}',
  '{TITLE} reflects {DIRECTOR}\'s interest in {QUALITY}',
  '{DIRECTOR} builds {TITLE} around a foundation of {QUALITY}',
  '{TITLE} represents a considered effort from {DIRECTOR}',
  'With {TITLE}, {DIRECTOR} continues to engage with {GENRE} conventions',
  '{DIRECTOR} frames {TITLE} as a study in {QUALITY}',
  '{TITLE} allows {DIRECTOR} to test the limits of {GENRE}',
  'In {TITLE}, {DIRECTOR} leans into {QUALITY}',
  '{DIRECTOR} delivers {TITLE}, a {GENRE_ADJ} undertaking',
  '{TITLE} sees {DIRECTOR} operating in a {GENRE_ADJ} register',
  'With {TITLE}, {DIRECTOR} attempts a {GENRE_ADJ} recalibration',
  '{DIRECTOR} crafts {TITLE} as a showcase for {QUALITY}',
  '{TITLE} underscores {DIRECTOR}\'s commitment to {QUALITY}',
  'In this {GENRE_ADJ} entry, {DIRECTOR} experiments',
  '{DIRECTOR} returns with {TITLE}, foregrounding {QUALITY}',
  '{TITLE} positions {DIRECTOR} within a broader {GENRE} conversation',
  '{DIRECTOR} treats {TITLE} as an opportunity for {QUALITY}',
  'With {TITLE}, {DIRECTOR} makes a case for {QUALITY}',
  '{TITLE} serves as a platform for {DIRECTOR}\'s {QUALITY}',
  '{DIRECTOR} anchors {TITLE} in {QUALITY}',
  'In {TITLE}, {DIRECTOR} commits to a {GENRE_ADJ} sensibility',
  '{TITLE} reveals {DIRECTOR}\'s ongoing fascination with {QUALITY}',
  '{DIRECTOR} presents {TITLE} as a {GENRE_ADJ} exercise',
  'With {TITLE}, {DIRECTOR} delivers a notably {GENRE_ADJ} effort',
  '{TITLE} finds {DIRECTOR} working in a deliberately {GENRE_ADJ} mode',
  'In {TITLE}, {DIRECTOR} adopts a {GENRE_ADJ} approach',
  '{DIRECTOR} frames {TITLE} within a distinctly {GENRE_ADJ} register',
  '{TITLE} reflects a {GENRE_ADJ} turn for {DIRECTOR}',
  'With {TITLE}, {DIRECTOR} opts for a more {GENRE_ADJ} sensibility',
  '{DIRECTOR} approaches {TITLE} with evident restraint',
  '{TITLE} situates {DIRECTOR} firmly within familiar {GENRE} territory',
  'In this {GENRE_ADJ} entry, {DIRECTOR} works at a measured pace',
  '{DIRECTOR} shapes {TITLE} around its {QUALITY}',
  '{TITLE} leans heavily on {QUALITY} under {DIRECTOR}\'s guidance',
  '{DIRECTOR} builds {TITLE} upon a foundation of {QUALITY}',
  'With {TITLE}, {DIRECTOR} emphasizes {QUALITY}',
  '{TITLE} foregrounds {DIRECTOR}\'s interest in {QUALITY}',
  '{DIRECTOR} returns with {TITLE}, maintaining a {GENRE_ADJ} tone',
  'In {TITLE}, {DIRECTOR} favors {QUALITY} over spectacle',
  '{TITLE} marks a restrained chapter for {DIRECTOR}',
  'With {TITLE}, {DIRECTOR} keeps the focus squarely on {QUALITY}',
  '{DIRECTOR} positions {TITLE} as a study in {QUALITY}',
  '{TITLE} continues {DIRECTOR}\'s engagement with {GENRE} conventions',
  '{DIRECTOR} commits {TITLE} to a {GENRE_ADJ} aesthetic',
  'In {TITLE}, {DIRECTOR} maintains a steady adherence to {QUALITY}',
  '{TITLE} unfolds under {DIRECTOR}\'s controlled hand',
  'With {TITLE}, {DIRECTOR} opts for clarity in {QUALITY}',
  '{DIRECTOR} keeps {TITLE} grounded in {QUALITY}',
  '{TITLE} represents a careful effort from {DIRECTOR}',
  'In this {GENRE_ADJ} work, {DIRECTOR} stays within defined parameters',
  '{DIRECTOR} navigates {TITLE} through a reliance on {QUALITY}',
  '{TITLE} reflects a disciplined, if cautious, approach from {DIRECTOR}',
  '{DIRECTOR} approaches {TITLE} as a meditation',
  'In {TITLE}, {DIRECTOR} constructs a {GENRE_ADJ} inquiry',
  '{DIRECTOR}\'s {TITLE} unfolds as a study',
  '{TITLE} situates {DIRECTOR} within a lineage',
  'With {TITLE}, {DIRECTOR} offers a {GENRE_ADJ} reflection',
  '{DIRECTOR} frames {TITLE} as an examination',
  'In this {GENRE_ADJ} {GENRE}, {DIRECTOR} considers',
  '{TITLE} reveals {DIRECTOR} to be a filmmaker attentive',
  '{DIRECTOR}\'s latest, {TITLE}, emerges as a {GENRE_ADJ} work',
  'Through {TITLE}, {DIRECTOR} engages',
  '{TITLE} confirms {DIRECTOR} as a director invested',
  '{DIRECTOR} situates {TITLE} within a {GENRE_ADJ} tradition',
  'In {TITLE}, a distinctly {GENRE_ADJ} sensibility guides {DIRECTOR}',
  '{DIRECTOR} shapes {TITLE} into a {GENRE_ADJ} exploration',
  '{TITLE} marks a moment in {DIRECTOR}\'s evolving practice',
  '{DIRECTOR} crafts {TITLE} as a vehicle',
  'In this work, {DIRECTOR} advances a {GENRE_ADJ} approach',
  '{TITLE} allows {DIRECTOR} to examine',
  '{DIRECTOR}\'s vision in {TITLE} crystallizes as a {GENRE_ADJ} statement',
  '{TITLE} positions {DIRECTOR} as a filmmaker concerned',
  'With a {GENRE_ADJ} lens, {DIRECTOR} approaches {TITLE}',
  '{DIRECTOR} renders {TITLE} as a formally attentive work',
  '{TITLE} stands as a {GENRE_ADJ} contribution',
  'In {TITLE}, {DIRECTOR} demonstrates a commitment',
  '{DIRECTOR}\'s authorship is evident in {TITLE}, a {GENRE_ADJ} project',
  '{DIRECTOR} situates {TITLE} as a study in {QUALITY}',
  '{TITLE} embodies {DIRECTOR}\'s {GENRE_ADJ} sensibility',
  'Through {TITLE}, {DIRECTOR} explores {QUALITY}',
  'In {TITLE}, {DIRECTOR} negotiates a {GENRE_ADJ} terrain',
  '{DIRECTOR} approaches {TITLE} with {QUALITY} in mind',
  'With {TITLE}, {DIRECTOR} investigates a {GENRE_ADJ} form',
  '{DIRECTOR}\'s {TITLE} is framed by {QUALITY}',
  '{TITLE} exemplifies {DIRECTOR}\'s {GENRE_ADJ} methodology',
  '{DIRECTOR} envisions {TITLE} as a {GENRE_ADJ} exploration',
  'In {TITLE}, {DIRECTOR} foregrounds {QUALITY}',
  '{TITLE} marks {DIRECTOR}\'s commitment to {QUALITY}',
  'With {TITLE}, {DIRECTOR} articulates a {GENRE_ADJ} vision',
  '{DIRECTOR} constructs {TITLE} as a {GENRE_ADJ} experiment',
  'In {TITLE}, {DIRECTOR} orchestrates {QUALITY}',
  '{TITLE} represents {DIRECTOR}\'s {GENRE_ADJ} approach',
  '{DIRECTOR}\'s {TITLE} navigates {QUALITY}',
  '{TITLE} stands out for {DIRECTOR}\'s {GENRE_ADJ} framing',
  '{DIRECTOR} uses {TITLE} to probe {QUALITY}',
  'Through {TITLE}, {DIRECTOR} achieves {GENRE_ADJ} clarity',
  '{TITLE} reflects {DIRECTOR}\'s {GENRE_ADJ} sensibility',
  'With {TITLE}, {DIRECTOR} interrogates {QUALITY}',
  '{DIRECTOR} configures {TITLE} in a {GENRE_ADJ} mode',
  '{TITLE} channels {DIRECTOR}\'s {QUALITY}-oriented vision',
  '{DIRECTOR}\'s {TITLE} foregrounds {QUALITY} and {GENRE_ADJ} perspective',
  'In {TITLE}, {DIRECTOR} balances {QUALITY} with a {GENRE_ADJ} sensibility',
  '{TITLE} exemplifies {DIRECTOR}\'s mastery of {QUALITY} in a {GENRE_ADJ} framework',
  '{DIRECTOR} exposes the contradictions of {TITLE}',
  'In {TITLE}, {DIRECTOR} interrogates class and power',
  '{DIRECTOR}\'s {TITLE} unmasks systemic inequities',
  'Through {TITLE}, {DIRECTOR} explores social hierarchies',
  '{TITLE} reveals the labor structures {DIRECTOR} interrogates',
  'With {TITLE}, {DIRECTOR} examines ideological formations',
  '{DIRECTOR} frames {TITLE} as a critique of capitalism',
  'In {TITLE}, {DIRECTOR} foregrounds social reproduction',
  '{TITLE} situates {DIRECTOR} within a lineage of political critique',
  '{DIRECTOR} uses {TITLE} to probe class struggle',
  'Through {TITLE}, {DIRECTOR} analyzes power relations',
  'In {TITLE}, {DIRECTOR} highlights systemic oppression',
  '{TITLE} exemplifies {DIRECTOR}\'s Marxist critique',
  '{DIRECTOR} interrogates economic disparity in {TITLE}',
  '{TITLE} channels the contradictions {DIRECTOR} exposes in society',
  '{DIRECTOR} foregrounds labor conditions in {TITLE}',
  '{TITLE} operates as a study of class and power under {DIRECTOR}\'s lens',
  '{DIRECTOR}\'s {TITLE} critiques commodification',
  '{TITLE} reflects {DIRECTOR}\'s attention to political economy',
  '{DIRECTOR} situates {TITLE} within systemic critique'
];



const MIDDLE_SENTENCES = [
  'that resonates with authentic emotion',
  'through intimate cinematography and nuanced performances',
  'with remarkable visual sophistication',
  'while maintaining a delicate balance between form and content',
  'that feels both personal and universal',
  'with confident pacing and precise editing',
  'through carefully composed frames',
  'that showcases technical excellence',
  'while allowing moments of silence to speak volumes',
  'with performances that feel lived-in and real',
  'through a distinctive visual language',
  'that demonstrates strong command of the medium',
  'with naturalistic dialogue and authentic performances',
  'while exploring complex themes with subtlety',
  'through evocative sound design',
  'that builds tension masterfully',
  'with a keen sense of atmosphere',
  'while never losing sight of character',
  'through bold creative choices',
  'that rewards close attention',
  'with a striking color palette',
  'while maintaining emotional honesty',
  'through layered storytelling',
  'that feels urgent and necessary',
  'with impressive visual economy',
  'while trusting the audience\'s intelligence',
  'through authentic character development',
  'that demonstrates mature filmmaking',
  'with precise shot composition',
  'while exploring timely themes',
  'through strong directorial vision',
  'that avoids easy answers',
  'with compelling visual metaphors',
  'while maintaining narrative clarity',
  'through thoughtful production design',
  'that feels cinematically alive',
  'with natural lighting that enhances mood',
  'while creating genuine suspense',
  'through economical storytelling',
  'that demonstrates careful craft',
  'with performances that anchor the narrative',
  'while maintaining tonal consistency',
  'through innovative camera work',
  'that feels fresh and original',
  'with a clear point of view',
  'while building to a satisfying conclusion',
  'through deliberate pacing',
  'that earns its emotional moments',
  'with striking visual contrasts',
  'while exploring universal human experiences',
  'through confident direction',
  'that demonstrates technical prowess',
  'with authentic location work',
  'while maintaining thematic focus',
  'through effective use of music',
  'that feels honest and unforced',
  'with careful attention to detail',
  'while creating memorable imagery',
  'through skilled editing',
  'that builds atmosphere effectively',
  'with strong ensemble work',
  'while never feeling derivative',
  'through purposeful cinematography',
  'that demonstrates storytelling confidence',
  'with compelling character arcs',
  'while maintaining visual consistency',
  'through evocative imagery',
  'that feels meticulously crafted',
  'with authentic emotional beats',
  'while exploring difficult subjects with care',
  'through assured performances',
  'that demonstrates visual flair',
  'with effective narrative structure',
  'while creating genuine moments of connection',
  'through thoughtful framing',
  'that feels cinematic in the best sense',
  'with strong thematic coherence',
  'while never overstaying its welcome',
  'through natural performances',
  'that demonstrates clear artistic vision',
  'with impressive production values',
  'while maintaining emotional authenticity',
  'through careful world-building',
  'that rewards repeated viewing',
  'with effective use of silence',
  'while creating visual poetry',
  'through disciplined storytelling',
  'that feels both intimate and expansive',
  'with naturalistic direction',
  'while exploring the human condition',
  'through compelling mise-en-scène',
  'that demonstrates filmmaking skill',
  'with strong visual storytelling',
  'while maintaining audience engagement',
  'through effective symbolism',
  'that feels purposeful and precise',
  'with memorable visual moments',
  'while creating emotional resonance',
  'through confident artistic choices',
  'that avoids sentimentality',
  'with striking visual composition',
  'with a steady visual hand',
  'through deliberate aesthetic choices',
  'while embracing genre conventions',
  'that privileges mood over momentum',
  'with a noticeable attention to detail',
  'through disciplined shot construction',
  'while occasionally overextending its reach',
  'that gestures toward larger ideas',
  'with performances of varying intensity',
  'through a carefully curated tone',
  'while resisting easy resolutions',
  'that favors contemplation over urgency',
  'with an evident respect for craft',
  'through moments of surprising intimacy',
  'while maintaining formal consistency',
  'that leans heavily on atmosphere',
  'with a sincerity that borders on earnestness',
  'through an unwavering stylistic approach',
  'while flirting with excess',
  'that signals ambitious intent',
  'with a deliberate sense of distance',
  'through extended passages of quiet',
  'while navigating uneven rhythms',
  'that aspires to profundity',
  'with an aesthetic that feels meticulously considered',
  'through controlled narrative framing',
  'while occasionally testing audience patience',
  'that suggests a filmmaker thinking aloud',
  'with a confidence that sometimes verges on insistence',
  'through an insistence on tonal cohesion',
  'with a noticeably restrained energy',
  'through deliberate, if predictable, choices',
  'while maintaining a consistent tone',
  'that rarely deviates from its framework',
  'with an emphasis on control',
  'through steady but unhurried pacing',
  'while avoiding dramatic excess',
  'that favors subtlety over impact',
  'with performances that remain measured',
  'through clean, unobtrusive framing',
  'while holding firmly to its structure',
  'that prioritizes coherence over surprise',
  'with a careful attention to continuity',
  'through extended quiet passages',
  'while resisting emotional extremes',
  'that settles into a deliberate rhythm',
  'with an understated visual palette',
  'through repetition of familiar beats',
  'while maintaining narrative focus',
  'that gestures toward larger themes',
  'with a commitment to tonal steadiness',
  'through a practical sense of staging',
  'while remaining comfortably within genre bounds',
  'that leans into its central premise',
  'with a calm, unembellished approach',
  'through functional scene construction',
  'while keeping expectations modest',
  'that signals disciplined restraint',
  'with a sense of creative caution',
  'through choices that emphasize stability',
  'with disciplined formal control', 'through deliberate pacing', 'while sustaining intellectual tension', 'that foregrounds character psychology',
  'with carefully modulated performances', 'through precise visual composition', 'while maintaining tonal equilibrium', 'that privileges thematic coherence',
  'with a measured narrative tempo', 'through rigorous structural design', 'while deepening emotional complexity', 'that articulates a clear artistic vision',
  'with subtle editorial rhythm', 'through restrained dramatic escalation', 'while allowing ideas to resonate', 'that integrates form and meaning',
  'with attentiveness to spatial dynamics', 'through controlled shifts in perspective', 'while refining its thematic focus', 'that unfolds with methodical clarity',
  'with deliberate compositional framing', 'through carefully calibrated tension', 'while sustaining narrative cohesion', 'that reveals disciplined craftsmanship',
  'with a steady formal assurance', 'through nuanced temporal layering', 'while orchestrating visual motifs', 'that sustains tonal coherence',
  'with methodical spatial arrangement', 'through rhythmically precise editing', 'while foregrounding performative subtlety', 'that deepens structural resonance',
  'with thoughtfully integrated mise-en-scène', 'through carefully articulated narrative arcs', 'while balancing emotional cadence', 'that maintains conceptual rigor',
  'with disciplined montage rhythm', 'through strategic visual juxtaposition', 'while exploring temporal elasticity', 'that accentuates formal intentionality',
  'with meticulous framing and focus', 'through layered compositional textures', 'while sustaining dramatic tension', 'that illuminates thematic undercurrents',
  'with spatially attentive design', 'through carefully controlled visual motifs', 'while negotiating tonal complexity', 'that foregrounds authorial intent',
  'with texturally conscious cinematography', 'through orchestrated narrative pacing', 'while maintaining aesthetic cohesion', 'that emphasizes structural clarity',
  'with carefully modulated rhythm', 'through intentional spatial orchestration', 'while articulating performative nuances', 'that underlines conceptual consistency',
  'with sustained formal engagement', 'through methodically considered sequencing', 'while fostering emotional resonance', 'that emphasizes narrative precision',
  'with precision-driven compositional awareness', 'through strategically layered editing', 'while maintaining thematic balance', 'that foregrounds visual intentionality',
  'with structurally deliberate construction', 'through rhythmically coherent cinematography', 'while foregrounding dramatic interplay', 'that enhances narrative clarity',
  'with attentive spatial choreography', 'through modulated temporal structuring', 'while reinforcing conceptual cohesion', 'that integrates performance and composition',
  'with disciplined tonal modulation', 'through precise visual articulation', 'while sustaining rhythmical consistency', 'that clarifies structural intent',
  'with compositional rigor', 'through careful formal articulation', 'while integrating temporal and spatial design', 'that elevates narrative clarity',
  'with conceptual attentiveness', 'through deliberate visual pacing', 'while orchestrating thematic threads', 'that accentuates aesthetic consistency',
  'with focused spatial composition', 'through rhythmically attentive editing', 'while preserving tonal integrity', 'that foregrounds formal precision',
  'with nuanced structural layering', 'through carefully controlled narrative flow', 'while articulating performance subtleties', 'that ensures cohesive visual logic',
  'with precise temporal calibration', 'through controlled visual dynamics', 'while maintaining narrative clarity', 'that reinforces conceptual intention',
  'with measured compositional economy', 'through strategically aligned mise-en-scène', 'while sustaining structural coherence', 'that exemplifies disciplined craft',
  'with attention to formal textures', 'through calibrated spatial orchestration', 'while foregrounding narrative intention', 'that illuminates authorial control',
  'with consistent tonal alignment', 'through structural precision', 'while articulating conceptual nuance', 'that reinforces thematic focus'
];



const CLOSING_SENTENCES = [
  'The film marks {DIRECTOR} as a talent to watch.',
  'A confident work that announces a promising filmmaker.',
  'An impressive achievement in {GENRE} filmmaking.',
  '{DIRECTOR} proves to be a distinctive voice in contemporary cinema.',
  'A must-watch for fans of thoughtful {GENRE}.',
  'The result is a film that lingers long after viewing.',
  '{DIRECTOR} has created something genuinely memorable.',
  'This is {GENRE} filmmaking at its finest.',
  'A remarkable debut that showcases serious talent.',
  'The film demonstrates {DIRECTOR}\'s clear artistic vision.',
  'An assured piece of cinema from a filmmaker in command.',
  '{DIRECTOR} delivers a film worthy of attention.',
  'A strong addition to contemporary {GENRE}.',
  'The film establishes {DIRECTOR} as a name to remember.',
  'An accomplished work that marks a significant achievement.',
  '{DIRECTOR} has crafted something special here.',
  'A film that deserves to find its audience.',
  'This marks {DIRECTOR} as a filmmaker with serious potential.',
  'An impressive entry in the {GENRE} canon.',
  'The result is a film that feels essential.',
  '{DIRECTOR} demonstrates filmmaking maturity beyond experience.',
  'A compelling work from an exciting new voice.',
  'The film showcases {DIRECTOR}\'s considerable talent.',
  'An achievement that announces a genuine filmmaker.',
  '{DIRECTOR} has created a work of substance.',
  'A film that operates on its own terms.',
  'This is confident filmmaking from start to finish.',
  '{DIRECTOR} proves adept at cinematic storytelling.',
  'An impressive showcase for {DIRECTOR}\'s abilities.',
  'The film marks a promising start to what should be a notable career.',
  'A work that demonstrates true cinematic vision.',
  '{DIRECTOR} has delivered something worth celebrating.',
  'An accomplished film that rewards the viewer.',
  'This establishes {DIRECTOR} as a serious talent.',
  'A memorable work from a filmmaker with a future.',
  'The film confirms {DIRECTOR}\'s status as one to watch.',
  'An assured piece of work from a confident filmmaker.',
  '{DIRECTOR} has crafted a film of real merit.',
  'A strong work that demonstrates considerable skill.',
  'This is filmmaking that matters.',
  '{DIRECTOR} shows promise of great things to come.',
  'An effective and memorable piece of cinema.',
  'The film marks {DIRECTOR} as an emerging talent.',
  'A work that showcases genuine filmmaking ability.',
  '{DIRECTOR} delivers a film of substance and style.',
  'An impressive achievement worthy of recognition.',
  'This is {GENRE} done right.',
  '{DIRECTOR} has announced themselves as a filmmaker of note.',
  'A film that achieves exactly what it sets out to do.',
  'The result is something genuinely worthwhile.',
  '{DIRECTOR} delivers a film of quiet conviction.',
  'A thoughtfully constructed piece of {GENRE} cinema.',
  'This affirms {DIRECTOR}\'s dedication to craft.',
  'A measured and deliberate work.',
  '{DIRECTOR} demonstrates commendable ambition.',
  'A film that reflects careful consideration.',
  'This signals continued growth for {DIRECTOR}.',
  'A confident addition to the {GENRE} canon.',
  '{DIRECTOR} brings discipline to the material.',
  'A solid and composed production.',
  'This is a film that clearly values its ideas.',
  '{DIRECTOR} presents a work of notable intention.',
  'A restrained but purposeful entry.',
  'This stands as a testament to methodical filmmaking.',
  '{DIRECTOR} proves willing to take risks.',
  'A film that prioritizes atmosphere over immediacy.',
  'This reveals a filmmaker unafraid of ambition.',
  'A work of evident thoughtfulness.',
  '{DIRECTOR} approaches the genre with seriousness.',
  'A film that commits fully to its vision.',
  'This confirms {DIRECTOR} as a deliberate stylist.',
  'A distinctive, if occasionally self-conscious, effort.',
  '{DIRECTOR} crafts a film of clear intent.',
  'A project that favors precision over flash.',
  'This demonstrates an admirable focus.',
  'A film of evident care and calculation.',
  '{DIRECTOR} shows a willingness to push form.',
  'A work that invites consideration.',
  'This is {GENRE} filmmaking marked by conviction.',
  'A film that lingers, whether quietly or insistently.',
  '{DIRECTOR} delivers a measured contribution to the {GENRE} field.',
  'A restrained and carefully managed production.',
  'This stands as a competent effort from {DIRECTOR}.',
  'A film that remains consistent in its intentions.',
  '{DIRECTOR} demonstrates control, if not urgency.',
  'A modest entry in contemporary {GENRE} cinema.',
  'This reflects a steady hand behind the camera.',
  'A work of clear structure and focus.',
  '{DIRECTOR} maintains a disciplined approach throughout.',
  'A film that values coherence over spectacle.',
  'This signals a thoughtful, if reserved, outing for {DIRECTOR}.',
  'A deliberately constructed piece of filmmaking.',
  '{DIRECTOR} offers a film of quiet determination.',
  'A consistent, if cautious, effort.',
  'This reinforces {DIRECTOR}\'s commitment to form.',
  'A film that adheres closely to its design.',
  '{DIRECTOR} keeps expectations measured.',
  'A project defined by restraint.',
  'This stands as a stable addition to the {GENRE} landscape.',
  'A film that favors steadiness over flourish.',
  '{DIRECTOR} delivers a controlled and deliberate work.',
  'A reserved but cohesive production.',
  'This confirms {DIRECTOR}\'s preference for discipline.',
  'A film that remains faithful to its framework.',
  '{DIRECTOR} prioritizes structure throughout.',
  'A clear, if understated, statement.',
  'This reflects careful, methodical filmmaking.',
  'A work that stays firmly within its boundaries.',
  '{DIRECTOR} opts for consistency above all else.',
  'A film that accomplishes precisely what it sets out to attempt.',
  '{DIRECTOR} demonstrates a command of form and intention.',
  'A work of notable formal intelligence.',
  'This confirms {DIRECTOR} as a filmmaker of serious purpose.',
  'A confident addition to contemporary {GENRE} cinema.',
  '{DIRECTOR} shapes the material with admirable discipline.',
  'A thoughtfully realized cinematic achievement.',
  'This affirms {DIRECTOR}\'s evolving artistic voice.',
  'A film distinguished by its clarity of vision.',
  '{DIRECTOR} approaches the form with admirable rigor.',
  'A compelling example of deliberate craftsmanship.',
  'This work reflects sustained artistic conviction.',
  '{DIRECTOR} reveals a mature command of cinematic language.',
  'A measured yet impactful accomplishment.',
  'This signals {DIRECTOR} as a distinctive presence.',
  'A film of intellectual and formal coherence.',
  '{DIRECTOR} balances ambition with structural discipline.',
  'A precise and thoughtfully constructed piece.',
  'This stands as a testament to focused authorship.',
  '{DIRECTOR} engages the medium with disciplined intent.',
  'A resonant entry in the landscape of {GENRE} filmmaking.',
  'This reflects a filmmaker attentive to craft.',
  '{DIRECTOR} brings clarity and purpose to the material.',
  'A quietly assured work.',
  'This establishes {DIRECTOR} as a director of discernment.',
  'A formally considered and intellectually grounded film.',
  'The work exemplifies {DIRECTOR}\'s structural precision.',
  'A film of careful compositional and narrative balance.',
  '{DIRECTOR} demonstrates nuanced control over rhythm and tone.',
  'This affirms {DIRECTOR}\'s authority over cinematic form.',
  'A disciplined study in narrative and visual interplay.',
  'The film stands as a testament to meticulous craft.',
  '{DIRECTOR}\'s command of space and timing is evident.',
  'A work of controlled, precise cinematic execution.',
  'This confirms {DIRECTOR}\'s status as a thoughtful filmmaker.',
  'A formally rigorous and thematically coherent piece.',
  'The film exemplifies intellectual and artistic discipline.',
  '{DIRECTOR} demonstrates mastery of compositional and temporal structure.',
  'A controlled, elegant exercise in filmmaking craft.',
  'This film reflects {DIRECTOR}\'s precision-driven authorship.',
  'A measured, intellectually attentive cinematic work.',
  '{DIRECTOR} displays deliberate care in every visual and narrative choice.',
  'This stands as a carefully articulated artistic statement.',
  'A film of formal sophistication and narrative clarity.',
  'The work showcases {DIRECTOR}\'s disciplined approach.',
  'A precise, cohesive, and intellectually grounded achievement.',
  '{DIRECTOR} demonstrates attentiveness to performance, composition, and thematic resonance.',
  'A carefully structured and coherent piece of filmmaking.',
  'The film exemplifies intentional and disciplined artistry.',
  '{DIRECTOR} achieves a balance of formal rigor and thematic depth.',
  'This work confirms {DIRECTOR}\'s dedication to craft and structure.',
  'A film of measured, thoughtful execution.',
  'A precisely articulated work that foregrounds {DIRECTOR}\'s vision.',
  'This confirms the filmmaker\'s disciplined approach to cinematic form.',
  'A clear, cohesive, and formally assured piece.',
  'A film that refuses to separate aesthetics from social critique.',
  'This confirms {DIRECTOR}\'s commitment to politically engaged cinema.',
  'An incisive study of class and power dynamics.',
  'A work that foregrounds ideological critique over spectacle.',
  'This positions {DIRECTOR} as a filmmaker attentive to systemic inequities.',
  'A politically aware cinematic investigation.',
  'A radical interrogation of social structures through cinema.',
  'This confirms the enduring relevance of critical, Marxist-informed film practice.',
  'A work that illuminates structural oppression.',
  'A cinema of ideas and social conscience.',
  'This film critiques capitalism without compromising artistic vision.',
  'An ambitious study of power and material conditions.',
  'A cinematic exploration of systemic inequity.',
  'A reflection on class struggle through compelling narrative.',
  'A critical engagement with social hierarchies.',
  'A politically astute, aesthetically precise work.',
  'A study of ideology framed through cinematic craft.',
  'A film that challenges normative social structures.',
  'This demonstrates {DIRECTOR}\'s commitment to socially conscious cinema.'
];



const GENRE_ADJECTIVES = {
  'Drama': ['poignant', 'powerful', 'intimate', 'affecting', 'moving', 'thoughtful', 'restrained', 'meditative', 'character-driven', 'somber', 'earnest', 'quietly observed', 'muted', 'low-key', 'subdued', 'modest', 'unadorned', 'psychologically acute', 'affectively nuanced', 'persona-focused', 'morally probing', 'introspective', 'contemplative', 'microcosmic', 'ethically complex', 'quietly intense', 'attentively documented', 'dialogue-driven', 'formally disciplined', 'thematically focused', 'conduct-aware', 'grounded', 'naturalistic', 'tonally measured', 'reflective', 'deliberate', 'story-attentive', 'dramaturgically controlled', 'emotionally calibrated', 'subtle', 'form-consistent', 'interior', 'culturally attuned', 'quietly affecting', 'psychologically layered', 'restrained yet resonant', 'actor-centered', 'plot-conscious', 'classically structured', 'materially layered', 'observationally detailed', 'ethically engaged', 'temporally deliberate', 'modestly scaled', 'compositionally careful', 'contemplatively paced', 'enveloping', 'socially conscious', 'structurally patient', 'performance-driven', 'thematically grounded', 'emotionally articulate', 'ideologically charged', 'class-conscious', 'socially pointed', 'structurally subversive', 'politically aware', 'materially attentive', 'systemically engaged', 'economically perceptive', 'power-conscious', 'critically reflective', 'formally radical', 'historically informed', 'culturally analytic', 'labor-conscious', 'structurally probing', 'politically urgent', 'psychologically subversive', 'system-aware', 'ethically attentive', 'socially interrogative'],
  'Comedy': ['sharp', 'witty', 'clever', 'observational', 'charming', 'incisive', 'dry', 'deadpan', 'satirical', 'absurdist', 'irreverent', 'playful', 'mildly amusing', 'dryly observational', 'gentle', 'low-energy', 'offbeat', 'understated', 'sharply observed', 'socially attuned', 'dryly incisive', 'character-driven', 'tonally agile', 'wry', 'ironic', 'tempo-disciplined', 'playfully subversive', 'attentively documented', 'culturally literate', 'brisk', 'dialogue-forward', 'structurally playful', 'sly', 'nimble', 'situational', 'conversational', 'tightly paced', 'self-aware', 'knowingly constructed', 'culturally attuned', 'performance-centered', 'textually layered', 'comedic yet restrained', 'sharply timed', 'microcosmic', 'affectively nuanced', 'modest in scope', 'quietly absurd', 'thematically pointed', 'urbanely comic', 'tonally disciplined', 'culturally observant', 'literate', 'irony-inflected', 'humor-driven', 'carefully modulated', 'subtly exaggerated', 'ensemble-focused', 'situationally acute', 'perspective-centered', 'persona-focused', 'dialogue-centered', 'story-attentive', 'gently satirical', 'satirically incisive', 'ideologically sharp', 'class-conscious', 'structurally subversive', 'politically literate', 'socially pointed', 'critically playful', 'economically aware', 'ironically subversive', 'materially observant', 'system-aware', 'wage-conscious', 'production-conscious', 'structurally ironic', 'dialectically tuned', 'labor-minded', 'satire-driven', 'structurally agile', 'ideologically nuanced'],
  'Documentary': ['revealing', 'illuminating', 'compelling', 'insightful', 'engaging', 'thought-provoking', 'observational', 'investigative', 'patient', 'journalistic', 'candid', 'socially conscious', 'observant', 'unembellished', 'straightforward', 'measured', 'plainspoken', 'matter-of-fact', 'attentively documented', 'rigorously researched', 'socially engaged', 'ethically attentive', 'access-driven', 'patiently observed', 'interview-driven', 'vérité-inflected', 'contextually grounded', 'historically aware', 'politically attentive', 'methodically constructed', 'analytically framed', 'structurally disciplined', 'thematically coherent', 'archive-informed', 'enveloping', 'subject-centered', 'inquiry-driven', 'microcosmic', 'formally restrained', 'culturally attuned', 'fact-driven', 'quietly probing', 'longitudinal', 'critically framed', 'research-oriented', 'culturally attentive', 'ethically grounded', 'context-rich', 'carefully assembled', 'institutionally aware', 'systems-conscious', 'perspective-centered', 'documentarianly rigorous', 'witness-oriented', 'methodical', 'socially observant', 'narratively structured', 'field-based', 'critically observant', 'archive-conscious', 'issue-focused', 'discursively framed', 'carefully contextualized', 'structurally measured', 'journalistically informed', 'politically attentive', 'class-conscious', 'ideologically probing', 'structurally investigative', 'systemically aware', 'socially engaged', 'critique-driven', 'materially grounded', 'economically attuned', 'power-conscious', 'historically informed', 'ethically reflective', 'labor-conscious', 'culturally tuned', 'structurally rigorous', 'politically precise', 'textually analytic', 'socially reflective', 'systematically engaged'],
  'Horror': ['unsettling', 'atmospheric', 'tense', 'chilling', 'psychological', 'nightmarish', 'brooding', 'ominous', 'disturbing', 'slow-burning', 'claustrophobic', 'dread-soaked', 'slow-building', 'measured', 'muted', 'atmosphere-driven'],
  'Sci-Fi': ['imaginative', 'cerebral', 'visionary', 'ambitious', 'conceptual', 'speculative', 'futuristic', 'philosophical', 'world-building', 'technologically ambitious', 'high-concept', 'idea-driven', 'concept-heavy', 'austere', 'minimalist', 'deliberate', 'contained', 'thought-oriented'],
  'Thriller': ['gripping', 'taut', 'suspenseful', 'intense', 'riveting', 'edge-of-your-seat', 'propulsive', 'methodical', 'nerve-wracking', 'lean', 'paranoid', 'restrained', 'slow-moving', 'procedural', 'steady', 'controlled'],
  'Animation': ['inventive', 'visually stunning', 'creative', 'imaginative', 'beautifully crafted', 'artistic', 'handcrafted', 'stylized', 'expressive', 'meticulously designed', 'vibrant', 'whimsical', 'minimalist', 'simply rendered', 'pared-down', 'intimate', 'small-scale'],
  'Experimental': ['bold', 'audacious', 'unconventional', 'avant-garde', 'challenging', 'innovative', 'formally daring', 'structurally playful', 'impressionistic', 'deconstructed', 'genre-defying', 'structural', 'rigorous', 'spare', 'concept-driven', 'minimal', 'form-focused', 'structurally unconventional', 'non-narrative', 'materially driven', 'process-oriented', 'structurally fragmentary', 'abstract', 'conceptually driven', 'rhythm-based', 'image-forward', 'temporally elastic', 'structurally deconstructed', 'sensorial', 'formally exploratory', 'medium-conscious', 'texturally driven', 'self-aware', 'durational', 'formally investigative', 'aesthetically radical', 'structurally open-ended', 'perception-focused', 'materially attentive', 'montage-driven', 'non-linear', 'methodologically bold', 'formally interrogative', 'concept-forward', 'materially expressive', 'structurally disruptive', 'aesthetic-centered', 'inquiry-based', 'spatially abstract', 'temporally layered', 'medium-specific', 'visually investigative', 'formally reflexive', 'structurally porous', 'sensory-driven', 'compositionally abstract', 'narratively destabilized', 'ideational', 'materially grounded', 'form-driven', 'structurally iterative', 'aesthetically rigorous', 'perception-oriented', 'conceptually elastic', 'formally ambitious', 'structurally radical', 'ideologically subversive', 'politically challenging', 'systemically probing', 'class-conscious', 'materially investigative', 'socially reflective', 'textually complex', 'critique-driven', 'conceptually rigorous', 'dialectically tuned', 'formally disruptive', 'system-aware', 'materially experimental', 'ideologically inventive', 'socially resonant', 'formally abstract'],
  'Romance': ['tender', 'bittersweet', 'yearning', 'melancholic', 'sincere', 'old-fashioned', 'tentative', 'reserved', 'quiet', 'low-key', 'unvarnished'],
  'Action': ['kinetic', 'muscular', 'high-octane', 'stunt-driven', 'operatic', 'spectacle-forward', 'contained', 'grounded', 'functional', 'practical', 'straightforward', 'economical', 'kinetically driven', 'propulsive', 'tightly structured', 'viscerally staged', 'momentum-focused', 'high-stakes', 'briskly paced', 'tactically composed', 'precision-engineered', 'tension-oriented', 'forward-moving', 'physically grounded', 'energetically mounted', 'spatially aware', 'adrenaline-inflected', 'structurally dynamic', 'impact-driven', 'deliberately escalated', 'spectacle-conscious', 'operationally precise', 'strategically paced', 'enveloping', 'terrain-focused', 'combat-oriented', 'expansively staged', 'tempo-disciplined', 'meticulously choreographed', 'intensity-driven', 'mission-centered', 'scope-conscious', 'structurally escalating', 'controlled yet forceful', 'tactically layered', 'event-driven', 'velocity-conscious', 'crisply executed', 'physically immediate', 'class-conscious', 'structurally charged', 'ideologically alert', 'politically propulsive', 'socially aware', 'materially attuned', 'systemically reflective', 'formally forceful', 'critically kinetic', 'power-conscious', 'dialectically tuned', 'labor-conscious', 'structurally tense', 'politically urgent', 'materially precise', 'economically attuned', 'socially pointed', 'ideologically aggressive', 'formally rigorous', 'system-aware'],
  'Fantasy': ['mythic', 'world-building', 'imaginatively rendered', 'allegorical', 'symbolically layered', 'dreamlike', 'metaphysical', 'mythopoetic', 'visionary', 'atmospherically immersive', 'otherworldly', 'archetypal', 'materially layered', 'cosmologically curious', 'fable-like', 'enchanted', 'speculative', 'richly imagined', 'visually ornate', 'folkloric', 'transcendent', 'realm-spanning', 'spiritually inflected', 'surreal', 'lore-driven', 'imaginatively expansive', 'ritualistic', 'atmospherically textured', 'myth-infused', 'symbolic', 'visionary in scope', 'metaphoric', 'cosmically scaled', 'aesthetically transportive', 'epic', 'dream-inflected', 'transcendentally framed', 'narratively enchanted', 'imaginatively ambitious', 'iconographically rich', 'systemically allegorical', 'ideologically imaginative', 'politically layered', 'class-conscious', 'structurally visionary', 'socially pointed', 'materially speculative', 'dialectically allegorical', 'politically metaphoric', 'system-aware', 'power-conscious', 'historically reflective', 'ideologically dreamlike', 'critique-infused', 'structurally enchanted', 'materially rich', 'socially allegorical', 'formally visionary', 'textually symbolic', 'systemically mythic'],
  'Action/Adventure': ['kinetically driven', 'propulsive', 'tightly structured', 'viscerally staged', 'momentum-focused', 'high-stakes', 'briskly paced', 'muscular', 'tactically composed', 'precision-engineered', 'tension-oriented', 'forward-moving', 'physically grounded', 'energetically mounted', 'spatially aware', 'adrenaline-inflected', 'structurally dynamic', 'impact-driven', 'deliberately escalated', 'large-scale', 'spectacle-conscious', 'disciplined', 'operationally precise', 'strategically paced', 'enveloping', 'terrain-focused', 'combat-oriented', 'expansively staged', 'tempo-disciplined', 'meticulously choreographed', 'intensity-driven', 'mission-centered', 'scope-conscious', 'structurally escalating', 'controlled yet forceful', 'tactically layered', 'event-driven', 'velocity-conscious', 'crisply executed', 'physically immediate', 'class-conscious', 'structurally charged', 'ideologically alert', 'politically propulsive', 'socially aware', 'materially attuned', 'systemically reflective', 'formally forceful', 'critically kinetic', 'power-conscious', 'dialectically tuned', 'labor-conscious', 'structurally tense', 'politically urgent', 'materially precise', 'economically attuned', 'socially pointed', 'ideologically aggressive', 'formally rigorous', 'system-aware'],
  'OTHER': ['formally assured', 'thematically attentive', 'structurally deliberate', 'tonally precise', 'carefully composed', 'thoughtfully mounted', 'story-attentive', 'aesthetically disciplined', 'meticulously crafted', 'visually attentive', 'rigorously constructed', 'affectively nuanced', 'compositionally refined', 'structurally coherent', 'stylistically controlled', 'atmospherically shaped', 'conceptually attentive', 'methodically paced', 'purposefully framed', 'artistically grounded', 'plot-conscious', 'craft-conscious', 'aesthetically measured', 'intention-driven', 'perspective-centered', 'thematically anchored', 'compositionally balanced', 'tempo-disciplined', 'carefully structured', 'form-consistent', 'artistically focused', 'discipline-driven', 'deliberately shaped', 'cinematically articulate', 'thoughtfully realized', 'formally grounded', 'precision-focused', 'structurally refined', 'tonally coherent', 'stylistically measured', 'narratively disciplined', 'carefully articulated', 'aesthetically coherent', 'methodically structured', 'emotionally grounded', 'visually disciplined', 'structurally intentional', 'thematically resonant', 'compositionally assured', 'cinematically focused', 'politically aware', 'ideologically precise', 'structurally attentive', 'class-conscious', 'socially reflective', 'materially disciplined', 'systemically tuned', 'critically framed', 'conceptually grounded', 'behaviorally attentive', 'socially nuanced', 'politically resonant', 'textually layered', 'materially precise', 'ideologically calibrated', 'structurally focused', 'critique-driven']
};

function normalizeGenre(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'OTHER';
  if (GENRE_ADJECTIVES[raw]) return raw;

  const compact = raw.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
  const aliases = {
    drama: 'Drama',
    dramatic: 'Drama',
    comedy: 'Comedy',
    comedic: 'Comedy',
    documentary: 'Documentary',
    doc: 'Documentary',
    docs: 'Documentary',
    horror: 'Horror',
    scifi: 'Sci-Fi',
    sciencefiction: 'Sci-Fi',
    thriller: 'Thriller',
    animation: 'Animation',
    animated: 'Animation',
    experimental: 'Experimental',
    experiment: 'Experimental',
    xr: 'Experimental',
    romance: 'Romance',
    action: 'Action',
    actionadventure: 'Action/Adventure',
    fantasy: 'Fantasy'
  };
  return aliases[compact] || 'OTHER';
}



const QUALITIES = [
  'visual storytelling', 'emotional depth', 'technical precision', 'narrative clarity',
  'atmospheric tension', 'character development', 'thematic richness', 'cinematic vision',
  'authentic performances', 'careful pacing', 'visual composition', 'tonal control',
  'formal restraint', 'measured storytelling', 'aesthetic discipline', 'structural ambition',
  'visual confidence', 'narrative ambition', 'editorial precision', 'emotional intelligence',
  'thematic focus', 'dramatic control', 'careful world-building', 'performance direction',
  'subtle character work', 'tonal ambition', 'visual coherence', 'stylistic consistency',
  'formal experimentation', 'deliberate pacing', 'atmospheric control', 'production design detail',
  'conceptual clarity', 'cinematic restraint', 'narrative patience', 'structural discipline',
  'sound design work', 'controlled minimalism', 'measured scope', 'a clear directorial perspective',
  'disciplined execution', 'quiet confidence',
  'formal minimalism', 'measured execution', 'structural simplicity', 'narrative restraint',
  'tonal consistency', 'controlled pacing', 'austere framing', 'modest ambition',
  'thematic directness', 'deliberate repetition', 'subdued performances', 'contained scope',
  'visual restraint', 'narrative economy', 'structural clarity', 'careful construction',
  'tonal steadiness', 'limited scale', 'minimalist design', 'measured atmosphere',
  'intentional stillness', 'understated approach', 'straightforward storytelling',
  'consistent mood', 'disciplined framing', 'pared-down aesthetics', 'practical staging',
  'reserved tone', 'unembellished presentation', 'a clear structural framework',
  'formal precision', 'structural coherence', 'thematic discipline', 'psychological acuity', 'spatial awareness',
  'rhythmic control', 'tonal intelligence', 'visual rigor', 'conceptual clarity',
  'performance calibration', 'dramatic architecture', 'editorial discipline', 'compositional control',
  'aesthetic discipline', 'dramaturgical focus', 'visual intentionality', 'tonal modulation', 'narrative momentum',
  'philosophical inquiry', 'cinematic authorship', 'temporal control', 'expressive economy',
  'architectural framing', 'dialogue precision', 'camera articulation', 'editing subtlety',
  'storytelling clarity', 'suspense calibration', 'textural cohesion', 'rhythmic modulation',
  'spatial composition', 'tonal layering', 'performance nuance', 'visual articulation', 'structural intentionality',
  'narrative pacing', 'emotional layering', 'textural awareness', 'dramaturgical subtlety',
  'conceptual depth', 'medium consciousness', 'formal inventiveness', 'structural elegance', 'expressive restraint',
  'visual economy', 'temporal fluidity', 'editing rhythm', 'performative calibration',
  'textural nuance', 'tonal calibration', 'structural rigor',
  'dialogue layering', 'temporal modulation', 'dramaturgical economy',
  'visual layering', 'architectural clarity', 'formal sophistication', 'conceptual nuance',
  'performance intelligence', 'narrative layering', 'spatial orchestration',
  'medium-specific awareness', 'textural richness', 'formal articulation', 'rhythmic sophistication',
  'emotional cadence', 'conceptual layering', 'dramaturgical intelligence',
  'editing modulation', 'thematic articulation',
  'narrative control', 'spatial sophistication', 'tonal precision', 'performance layering', 'structural clarity',
  'visual intelligence', 'formal layering', 'conceptual sophistication', 'textural precision', 'editorial clarity',
  'dramaturgical calibration', 'narrative sophistication', 'medium-conscious articulation', 'temporal sophistication'
];


// ==================== MAIN FUNCTIONS ====================

function onFormSubmit(e) {
  try {
    const formData = extractFormData(e);
    const randomHours =
      Math.random() * (CONFIG.MAX_DELAY_HOURS - CONFIG.MIN_DELAY_HOURS) + CONFIG.MIN_DELAY_HOURS;
    const triggerTime = new Date(Date.now() + randomHours * 60 * 60 * 1000);

    const submissionId = 'submission_' + Date.now();
    const props = PropertiesService.getScriptProperties();
    props.setProperty(submissionId, JSON.stringify(formData));

    const trigger = ScriptApp.newTrigger('processSubmission')
      .timeBased()
      .at(triggerTime)
      .create();

    props.setProperty('trigger_' + trigger.getUniqueId(), submissionId);
    Logger.log('Scheduled ' + submissionId + ' at ' + triggerTime.toISOString());

    // Save pending record to MongoDB immediately so admin can see it
    savePendingToMongo(formData, submissionId);
  } catch (error) {
    notifyAdmin_('onFormSubmit failed', error);
    Logger.log('Error in onFormSubmit: ' + error);
  }
}

function processSubmission(e) {
  const props = PropertiesService.getScriptProperties();
  const triggerId = e && e.triggerUid ? e.triggerUid : null;
  let submissionId = null;

  try {
    if (!triggerId) throw new Error('Missing triggerUid');

    submissionId = props.getProperty('trigger_' + triggerId);
    if (!submissionId) throw new Error('No submission ID for trigger ' + triggerId);

    const formDataJson = props.getProperty(submissionId);
    if (!formDataJson) throw new Error('No submission data for ' + submissionId);

    const formData = JSON.parse(formDataJson);
    Logger.log('Processing: ' + (formData.title || '(no title)'));

    const isAccepted = Math.random() < CONFIG.ACCEPTANCE_RATE;
    if (isAccepted) {
      handleAcceptance(formData, submissionId);
    } else {
      handleRejection(formData, submissionId);
    }
  } catch (error) {
    notifyAdmin_('processSubmission failed', error);
    Logger.log('Error in processSubmission: ' + error);
  } finally {
    if (submissionId) props.deleteProperty(submissionId);
    if (triggerId) {
      props.deleteProperty('trigger_' + triggerId);
      deleteTrigger(triggerId);
    }
  }
}

function handleAcceptance(formData, submissionId) {
  const review = generateReview(formData);
  const approved = approveInMongo(submissionId, review);
  if (!approved) {
    notifyAdmin_(
      'Acceptance blocked: DB approve failed',
      new Error('Did not send acceptance email because approveInMongo failed for ' + submissionId)
    );
    Logger.log('Acceptance blocked (DB approve failed): ' + (formData.title || '(no title)'));
    return;
  }

  sendAcceptanceEmail(formData, review);
  Logger.log('Accepted + published: ' + (formData.title || '(no title)'));
}

function handleRejection(formData, submissionId) {
  sendRejectionEmail(formData);
  deleteFromMongo(submissionId);
  Logger.log('Rejected: ' + (formData.title || '(no title)'));
}

// ==================== REVIEW GENERATION ====================

function parseDirectorNames(str) {
  return String(str || '').split(',').map(function(n) { return n.trim(); }).filter(Boolean);
}

function formatNames(str) {
  const names = parseDirectorNames(str);
  if (names.length === 0) return 'the director';
  if (names.length === 1) return names[0];
  if (names.length === 2) return names[0] + ' and ' + names[1];
  return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
}

function escapeRegex_(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyDirectorAgreement_(text, director, isPlural) {
  if (!isPlural) return text;

  var out = text;
  var directVerbPairs = [
    ['is', 'are'],
    ['has', 'have'],
    ['demonstrates', 'demonstrate'],
    ['creates', 'create'],
    ['crafts', 'craft'],
    ['delivers', 'deliver'],
    ['proves', 'prove'],
    ['shows', 'show'],
    ['reveals', 'reveal'],
    ['finds', 'find'],
    ['situates', 'situate'],
    ['frames', 'frame'],
    ['uses', 'use'],
    ['builds', 'build'],
    ['returns', 'return'],
    ['approaches', 'approach'],
    ['balances', 'balance'],
    ['navigates', 'navigate'],
    ['examines', 'examine'],
    ['positions', 'position'],
    ['treats', 'treat'],
    ['anchors', 'anchor'],
    ['foregrounds', 'foreground'],
    ['commits', 'commit'],
    ['keeps', 'keep'],
    ['opts', 'opt'],
    ['maintains', 'maintain'],
    ['prioritizes', 'prioritize'],
    ['confirms', 'confirm'],
    ['configures', 'configure']
  ];

  directVerbPairs.forEach(function(pair) {
    var rx = new RegExp(escapeRegex_(director) + ' ' + pair[0] + '\\b', 'g');
    out = out.replace(rx, director + ' ' + pair[1]);
  });

  out = out
    .replace(new RegExp('\\bdirector ' + escapeRegex_(director) + '\\b', 'g'), 'directors ' + director)
    .replace(new RegExp('\\bDirector ' + escapeRegex_(director) + '\\b', 'g'), 'Directors ' + director)
    .replace(/\ba promising filmmaker\b/g, 'promising filmmakers')
    .replace(/\ba filmmaker with serious potential\b/g, 'filmmakers with serious potential')
    .replace(/\ba filmmaker to watch\b/g, 'filmmakers to watch');

  return out;
}

function normalizeReviewText_(text) {
  var out = String(text || '')
    .replace(/\s+/g, ' ')
    // Avoid duplicated "balances X with X..." constructions.
    .replace(/\bbalances ([^,.;]+?) with \1(\b[^,.;]*)/gi, 'balances $1$2')
    .replace(/,\s+(that\b)/gi, ' $1')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])([^\s])/g, '$1 $2')
    .replace(/\.\s*\./g, '.')
    .trim();

  out = out.replace(/([.!?]\s+)([a-z])/g, function(_, p1, p2) { return p1 + p2.toUpperCase(); });
  if (out && !/[.!?]$/.test(out)) out += '.';
  return out;
}

function getMiddleFragmentLead_(fragment) {
  var s = String(fragment || '').trim().toLowerCase();
  if (s.indexOf('through ') === 0) return 'through';
  if (s.indexOf('with ') === 0) return 'with';
  if (s.indexOf('while ') === 0) return 'while';
  if (s.indexOf('that ') === 0) return 'that';
  return 'other';
}

function getMiddleFragmentFirstWord_(fragment) {
  var m = String(fragment || '').trim().toLowerCase().match(/^([a-z]+)/);
  return m && m[1] ? m[1] : '';
}

function pickMiddleSentences_() {
  var selected = [];
  var usedText = {};
  var usedLead = {};
  var usedFirstWord = {};
  var attempts = 0;

  while (selected.length < 3 && attempts < 300) {
    attempts += 1;
    var candidate = randomChoice(MIDDLE_SENTENCES);
    if (!candidate || usedText[candidate]) continue;

    var lead = getMiddleFragmentLead_(candidate);
    var firstWord = getMiddleFragmentFirstWord_(candidate);
    if (lead !== 'other' && usedLead[lead]) continue;
    if (firstWord && usedFirstWord[firstWord]) continue;

    usedText[candidate] = true;
    if (lead !== 'other') usedLead[lead] = true;
    if (firstWord) usedFirstWord[firstWord] = true;
    selected.push(candidate);
  }

  attempts = 0;
  while (selected.length < 3 && attempts < 300) {
    attempts += 1;
    var candidate2 = randomChoice(MIDDLE_SENTENCES);
    if (!candidate2 || usedText[candidate2]) continue;
    var firstWord2 = getMiddleFragmentFirstWord_(candidate2);
    if (firstWord2 && usedFirstWord[firstWord2]) continue;
    usedText[candidate2] = true;
    if (firstWord2) usedFirstWord[firstWord2] = true;
    selected.push(candidate2);
  }

  attempts = 0;
  while (selected.length < 3 && attempts < 300) {
    attempts += 1;
    var candidate3 = randomChoice(MIDDLE_SENTENCES);
    if (!candidate3 || usedText[candidate3]) continue;
    usedText[candidate3] = true;
    selected.push(candidate3);
  }

  selected.sort(function(a, b) {
    var aThat = getMiddleFragmentLead_(a) === 'that' ? 0 : 1;
    var bThat = getMiddleFragmentLead_(b) === 'that' ? 0 : 1;
    return aThat - bThat;
  });

  return selected;
}

function buildReviewSentence_(opening, middles) {
  var parts = Array.isArray(middles) ? middles.slice(0) : [];
  var out = String(opening || '');

  parts.forEach(function(fragment, idx) {
    if (!fragment) return;
    var lead = getMiddleFragmentLead_(fragment);
    if (idx === 0) {
      out += ' ' + fragment;
      return;
    }
    if (lead === 'that') {
      out += ' ' + fragment;
      return;
    }
    out += ', ' + fragment;
  });

  return out;
}

function randomChoice(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReview(formData) {
  const opening = randomChoice(OPENING_SENTENCES);
  const middles = pickMiddleSentences_();
  const closing = randomChoice(CLOSING_SENTENCES);

  const genre = normalizeGenre(formData.genre);
  const genreAdjs = GENRE_ADJECTIVES[genre] || ['compelling', 'engaging', 'thoughtful'];
  const genreAdj = randomChoice(genreAdjs);
  const quality1 = randomChoice(QUALITIES);
  const quality2 = randomChoice(QUALITIES.filter(function(q) { return q !== quality1; }));
  const directorNames = parseDirectorNames(formData.director);
  const isPluralDirector = directorNames.length > 1;
  const director = formatNames(formData.director);

  let review = buildReviewSentence_(opening, middles) + '. ' + closing;

  review = review
    .replace(/{TITLE}/g, formData.title || 'this film')
    .replace(/{DIRECTOR}/g, director)
    .replace(/{GENRE}/g, genre.toLowerCase())
    .replace(/{GENRE_ADJ}/g, genreAdj);

  let qualityCounter = 0;
  review = review.replace(/{QUALITY}/g, function() {
    qualityCounter += 1;
    return qualityCounter === 1 ? quality1 : quality2;
  });

  review = applyDirectorAgreement_(review, director, isPluralDirector);
  return normalizeReviewText_(review);
}

export { generateReview };
