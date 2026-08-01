/**
 * Seeds the library with a set of published example guides.
 *
 * Idempotent: a project whose title already exists is skipped, so this can be
 * re-run safely after a partial failure.
 *
 * Usage:  npm run seed:projects
 *
 * Ownership goes to the first admin account. Run `npm run promote-admin` first
 * if none exists — a project needs a creator, and attributing seed content to a
 * regular teacher's account would misrepresent who wrote it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// This runs outside Next, which is what normally loads .env.local.
const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(here, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

const { sequelize } = await import('../lib/config/db.js');
const { Project, User } = await import('../lib/models/index.js');

const rupees = (n) => n;

const PROJECTS = [
  {
    title: 'Bottle water filter',
    summary:
      'Build a working four-layer filter from a plastic bottle and show why each layer matters.',
    description:
      'Students cut a plastic bottle, invert the top half, and pack it with gravel, coarse sand, fine sand and charcoal. Muddy water poured through comes out visibly clear.\n\nThe point of the activity is not the clear water — it is that each layer removes a different size of particle. Ask students to predict what happens if they remove one layer, then let them try it. Running the filter with the sand layers swapped is the most useful "failure" in the whole activity.\n\nThe output is clear, not safe. This is a demonstration of filtration, not of purification, and that distinction is the main thing students should leave with.',
    subject: 'Chemistry',
    concept: 'Separation of mixtures by particle size; filtration',
    classLevel: '6-8',
    difficulty: 'Easy',
    budget: rupees(40),
    estimatedTimeMinutes: 45,
    tags: ['water', 'filtration', 'recycled', 'environment'],
    materials: [
      { name: 'Plastic bottle, 1 litre', quantity: '1', estimatedCost: 0, alternative: 'Any clear bottle', note: 'Reused; rinse before cutting' },
      { name: 'Coarse gravel', quantity: '1 cup', estimatedCost: 5, alternative: 'Small pebbles from the schoolyard', note: null },
      { name: 'Coarse sand', quantity: '1 cup', estimatedCost: 5, alternative: null, note: 'Wash until the runoff is clear' },
      { name: 'Fine sand', quantity: '1 cup', estimatedCost: 5, alternative: null, note: null },
      { name: 'Activated charcoal', quantity: 'half cup', estimatedCost: 20, alternative: 'Crushed charcoal from a cooking fire', note: 'The one item usually worth buying' },
      { name: 'Cotton cloth', quantity: '1 piece', estimatedCost: 5, alternative: 'An old cotton shirt', note: null },
    ],
    steps: [
      { title: 'Cut the bottle', description: 'Cut the bottle in half across the middle. Keep both halves — the top becomes the filter, the bottom catches the water.', safetyNote: 'An adult should make the cut. The edge is sharp; cover it with tape.' },
      { title: 'Invert and line', description: 'Turn the top half upside down so the neck points into the bottom half. Push the cloth into the neck as the bottom layer.', safetyNote: null },
      { title: 'Add charcoal', description: 'Add the charcoal on top of the cloth, about two fingers deep. This layer traps the finest particles and some odour.', safetyNote: null },
      { title: 'Add sand, fine then coarse', description: 'Fine sand next, then coarse sand. Ask students why the fine layer goes below the coarse one before you tell them.', safetyNote: null },
      { title: 'Add gravel', description: 'Gravel on top. It stops the sand from being disturbed when water is poured in.', safetyNote: null },
      { title: 'Run muddy water through', description: 'Mix soil into a jug of water and pour it in slowly. Collect what comes out and compare it against the original, side by side in clear glasses.', safetyNote: 'Nobody drinks the output. Filtration removes particles, not bacteria.' },
      { title: 'Break it on purpose', description: 'Rebuild with one layer missing, or with the sand layers swapped, and compare. This is where the concept actually lands.', safetyNote: null },
    ],
    learningOutcomes: [
      'Explain filtration as separation by particle size',
      'Predict the effect of removing or reordering a filter layer',
      'Distinguish "clear" from "safe to drink"',
    ],
    safetyPrecautions: [
      'An adult cuts the bottle; tape the cut edge before students handle it',
      'Do not drink the filtered water under any circumstances',
      'Wash hands after handling soil and charcoal',
    ],
  },

  {
    title: 'Straw-and-tape bridge load test',
    summary:
      'Build bridges from drinking straws and test them to destruction to find which shape carries the most weight.',
    description:
      'Groups build a 30 cm span from straws and tape, then load it with coins until it fails. The comparison across groups is the lesson: triangulated designs hold several times what rectangular ones do, using the same materials.\n\nRun it as a competition, but score on load per gram of straw used rather than raw load. Otherwise every group simply uses more straws, and the interesting result disappears.\n\nRecord where each bridge fails, not just when. Students usually predict the middle and are surprised by how often it is a joint.',
    subject: 'Engineering',
    concept: 'Structural stability; triangulation; compression and tension',
    classLevel: '6-8',
    difficulty: 'Easy',
    budget: rupees(60),
    estimatedTimeMinutes: 60,
    tags: ['structures', 'bridges', 'design', 'teamwork'],
    materials: [
      { name: 'Drinking straws', quantity: '40 per group', estimatedCost: 30, alternative: 'Rolled newspaper tubes', note: 'Paper straws work and are cheaper' },
      { name: 'Masking tape', quantity: '1 roll per group', estimatedCost: 25, alternative: 'Any tape', note: 'Limit each group to a fixed length' },
      { name: 'Coins or washers', quantity: '1 bag', estimatedCost: 0, alternative: 'Small stones of known weight', note: 'For loading' },
      { name: 'Plastic cup', quantity: '1', estimatedCost: 5, alternative: 'Cut-off bottle base', note: 'Hangs from the bridge to hold the load' },
      { name: 'Ruler', quantity: '1 per group', estimatedCost: 0, alternative: null, note: null },
    ],
    steps: [
      { title: 'Set the constraints', description: 'The bridge must span 30 cm between two tables and carry a cup hung from its centre. Fix the straw count and tape length so groups are comparable.', safetyNote: null },
      { title: 'Sketch before building', description: 'Each group draws their design first and marks where they expect it to fail. Ten minutes, no materials yet.', safetyNote: null },
      { title: 'Build', description: 'Twenty-five minutes. Do not correct designs you expect to fail — the failures are the lesson.', safetyNote: null },
      { title: 'Weigh each bridge', description: 'Record the mass of each bridge before testing. This is what makes the scoring fair.', safetyNote: null },
      { title: 'Load until failure', description: 'Add coins one at a time. Record the load at failure and the exact point where it broke.', safetyNote: 'Keep hands and faces away from the span. Straws can flick when a joint gives.' },
      { title: 'Compare and rebuild', description: 'Rank by load per gram. Give groups ten minutes to rebuild one weakness, then retest. Improvement between attempts is the real result.', safetyNote: null },
    ],
    learningOutcomes: [
      'Identify triangulation as the reason some structures carry more load',
      'Distinguish members in tension from members in compression',
      'Use a fair test by normalising load against material used',
    ],
    safetyPrecautions: [
      'Stand clear of the span during loading',
      'Load gradually — no dropping weights onto the bridge',
      'Scissors handled by one nominated student per group',
    ],
  },

  {
    title: 'Balloon-powered car',
    summary:
      'A cardboard car driven by a balloon, used to measure how thrust and mass change the distance travelled.',
    description:
      'Students build a small car from cardboard and bottle-cap wheels, tape a balloon to a straw as the nozzle, and race it. The build takes half the lesson; the measurement is the other half and is where the physics is.\n\nRun three trials per configuration and record distances. Then change exactly one variable — balloon size, or added mass taped to the chassis — and repeat. Students discover that a bigger balloon does not help indefinitely, and that a heavier car is slower but often travels straighter.\n\nAxle friction is what usually decides the winner, which is a more honest result than it first looks.',
    subject: 'Physics',
    concept: "Newton's third law; thrust, mass and friction",
    classLevel: '6-8',
    difficulty: 'Medium',
    budget: rupees(50),
    estimatedTimeMinutes: 60,
    tags: ['motion', 'newton', 'recycled', 'measurement'],
    materials: [
      { name: 'Stiff cardboard', quantity: '1 piece, 15x10 cm', estimatedCost: 0, alternative: 'Any carton side', note: 'Chassis' },
      { name: 'Bottle caps', quantity: '4', estimatedCost: 0, alternative: 'Cardboard discs', note: 'Wheels; pierce the exact centre' },
      { name: 'Bamboo skewers', quantity: '2', estimatedCost: 5, alternative: 'Straight sticks', note: 'Axles' },
      { name: 'Drinking straws', quantity: '2', estimatedCost: 5, alternative: null, note: 'Axle sleeves — this is what cuts friction' },
      { name: 'Balloon', quantity: '2', estimatedCost: 10, alternative: null, note: 'Bring spares; they split' },
      { name: 'Tape', quantity: '1 roll', estimatedCost: 25, alternative: null, note: null },
    ],
    steps: [
      { title: 'Make the chassis', description: 'Cut the cardboard to size. Tape two straw pieces across the underside, front and back — these are the bearings the axles turn inside.', safetyNote: null },
      { title: 'Fit the wheels', description: 'Pierce each cap through its centre and push it onto a skewer. Off-centre holes make the car veer; this is worth getting right.', safetyNote: 'An adult pierces the caps.' },
      { title: 'Mount the axles', description: 'Slide the skewers through the straws. The axle should spin freely — flick a wheel and it should keep turning.', safetyNote: null },
      { title: 'Attach the balloon', description: 'Tape the balloon neck around a straw, then tape that straw along the chassis pointing backwards.', safetyNote: null },
      { title: 'Measure three runs', description: 'Inflate with a counted number of breaths so trials are comparable. Release and measure the distance. Repeat three times and take the mean.', safetyNote: null },
      { title: 'Change one variable', description: 'Add a coin of mass to the chassis, or use a larger balloon — but only one change at a time. Re-measure and plot distance against the variable.', safetyNote: 'Do not over-inflate. A balloon bursting near a face is the main risk here.' },
    ],
    learningOutcomes: [
      "State Newton's third law and identify the action-reaction pair in the car",
      'Explain why reducing axle friction increases distance travelled',
      'Run a fair test by changing one variable and repeating trials',
    ],
    safetyPrecautions: [
      'An adult pierces the bottle caps',
      'Do not over-inflate balloons; keep them away from faces',
      'Clear a floor lane before releasing the car',
    ],
  },

  {
    title: 'Leaf-disc photosynthesis test',
    summary:
      'Watch leaf discs rise as they photosynthesise, and measure how the rate changes with light distance.',
    description:
      'Small discs cut from a leaf are sunk in a dilute bicarbonate solution using a syringe. Under light they produce oxygen, become buoyant, and float back up. Counting how long half the discs take to rise gives a measurable rate.\n\nThis is one of the few school biology experiments that produces a real number from a living process, and it works with spinach, hibiscus or most soft garden leaves.\n\nThe control matters here: a set of discs kept in darkness must not rise. Without it, students reasonably suspect the discs are just floating on their own.',
    subject: 'Biology',
    concept: 'Photosynthesis; the effect of light intensity on reaction rate',
    classLevel: '9-10',
    difficulty: 'Medium',
    budget: rupees(70),
    estimatedTimeMinutes: 70,
    tags: ['photosynthesis', 'plants', 'rate', 'measurement'],
    materials: [
      { name: 'Fresh soft leaves', quantity: '4-5', estimatedCost: 0, alternative: 'Spinach, hibiscus or amaranth', note: 'Thin leaves work best; avoid waxy ones' },
      { name: 'Baking soda', quantity: '1 teaspoon', estimatedCost: 5, alternative: null, note: 'Supplies dissolved carbon dioxide' },
      { name: 'Plastic syringe, 10 ml, no needle', quantity: '1', estimatedCost: 20, alternative: null, note: 'Needle-free only' },
      { name: 'Clear cups', quantity: '3', estimatedCost: 15, alternative: 'Cut-off bottle bases', note: 'One is the dark control' },
      { name: 'Hole punch or straw', quantity: '1', estimatedCost: 10, alternative: 'A straw cuts clean discs', note: null },
      { name: 'Desk lamp', quantity: '1', estimatedCost: 0, alternative: 'Direct sunlight and a shaded spot', note: null },
      { name: 'Liquid soap', quantity: '1 drop', estimatedCost: 5, alternative: null, note: 'Helps solution enter the leaf' },
    ],
    steps: [
      { title: 'Mix the solution', description: 'Dissolve a teaspoon of baking soda in 300 ml of water and add one drop of soap. More soap does not help and makes the discs stick together.', safetyNote: null },
      { title: 'Cut the discs', description: 'Punch ten discs per cup, avoiding the thick central vein.', safetyNote: null },
      { title: 'Sink the discs', description: 'Put the discs in the syringe with solution, seal the tip with a finger, pull the plunger to draw the air out, then release. Repeat until every disc sinks.', safetyNote: 'Do not use a syringe with a needle.' },
      { title: 'Set up light and dark', description: 'Place one cup 15 cm from the lamp, one at 40 cm, and wrap the third in foil or a cloth as the dark control.', safetyNote: 'A lamp gets hot. Keep it clear of paper and away from the cups.' },
      { title: 'Time the rise', description: 'Record how long until half the discs in each cup have floated. That is your rate measure.', safetyNote: null },
      { title: 'Compare', description: 'Plot rate against light distance and check the dark control has not risen. Discuss why the discs sank in the first place.', safetyNote: null },
    ],
    learningOutcomes: [
      'Explain that oxygen released during photosynthesis changes disc buoyancy',
      'Describe how light intensity affects the rate of photosynthesis',
      'Explain why a dark control is required for the result to mean anything',
    ],
    safetyPrecautions: [
      'Use a needle-free syringe only',
      'Keep the lamp away from water and paper; it gets hot',
      'Wash hands after handling plant material',
    ],
  },

  {
    title: 'Cardboard sundial and the shifting shadow',
    summary:
      'A calibrated sundial that students mark themselves across one day, then check a week later.',
    description:
      'A vertical gnomon on a flat card casts a shadow that students mark and label on the hour. By the end of the day they have a working sundial calibrated for their own latitude — and a record of how shadow length changes with the sun\'s altitude.\n\nThe part that makes this more than a craft activity is returning to it a week later. The hour marks are noticeably off, which opens up the difference between solar time and clock time, and why the discrepancy drifts through the year.\n\nIt needs a sunny day and a spot that is not shaded at any point, which is worth checking before the lesson rather than during it.',
    subject: 'Mathematics',
    concept: 'Angles, rotation and time; measurement of shadow length',
    classLevel: '6-8',
    difficulty: 'Easy',
    budget: rupees(30),
    estimatedTimeMinutes: 40,
    tags: ['geometry', 'angles', 'time', 'outdoor'],
    materials: [
      { name: 'Stiff card', quantity: '1 sheet A4', estimatedCost: 10, alternative: 'Carton side', note: 'The dial face' },
      { name: 'Straight stick or pencil', quantity: '1', estimatedCost: 0, alternative: 'A straw stiffened with tape', note: 'The gnomon' },
      { name: 'Protractor', quantity: '1', estimatedCost: 15, alternative: null, note: 'For setting the gnomon angle' },
      { name: 'Ruler and marker', quantity: '1 each', estimatedCost: 5, alternative: null, note: null },
      { name: 'Small stones', quantity: '4', estimatedCost: 0, alternative: 'Tape', note: 'To stop the card moving between readings' },
    ],
    steps: [
      { title: 'Fix the gnomon', description: 'Push the stick through the centre of the card so it stands vertical. Check it with a protractor from two directions, not one.', safetyNote: null },
      { title: 'Place and anchor', description: 'Put the card in a spot that stays sunlit all day. Weight the corners and mark the ground so it can be returned to exactly the same place.', safetyNote: null },
      { title: 'Mark on the hour', description: 'Every hour, draw along the shadow and write the time at its tip. Also record the shadow length.', safetyNote: 'Do not look directly at the sun at any point.' },
      { title: 'Plot shadow length', description: 'Graph length against time. The minimum marks local solar noon, which is usually not 12:00 on the clock.', safetyNote: null },
      { title: 'Measure the angles', description: 'Measure the angle between consecutive hour lines. Ask whether they are equal, and why they are not.', safetyNote: null },
      { title: 'Return a week later', description: 'Set the card back in the same spot and check the marks against a clock. Discuss what has drifted and why.', safetyNote: null },
    ],
    learningOutcomes: [
      "Relate the sun's apparent motion to shadow direction and length",
      'Measure and compare angles between hour lines',
      'Distinguish solar noon from clock noon',
    ],
    safetyPrecautions: [
      'Never look directly at the sun',
      'Use a blunt stick; do not sharpen the gnomon',
      'Wear a hat and take shade breaks on hot days',
    ],
  },

  {
    title: 'Electromagnet strength versus number of turns',
    summary:
      'Wind a nail with wire, then measure how many pins it lifts as the number of coil turns increases.',
    description:
      'A nail, some enamelled copper wire and a single cell make an electromagnet strong enough to lift paper pins. Students wind 50 turns, count the pins lifted, then add turns and repeat.\n\nThe resulting graph is convincingly close to linear over the range they can build, which makes it one of the more satisfying measurements available at this level.\n\nTwo practical notes: the wire ends must be scraped clean or nothing works, and the circuit warms up quickly. Disconnect between readings — that habit also keeps the cell alive long enough to finish the experiment.',
    subject: 'Physics',
    concept: 'Electromagnetism; magnetic field strength and coil turns',
    classLevel: '9-10',
    difficulty: 'Medium',
    budget: rupees(90),
    estimatedTimeMinutes: 50,
    tags: ['electricity', 'magnetism', 'measurement', 'circuits'],
    materials: [
      { name: 'Iron nail, 8-10 cm', quantity: '1', estimatedCost: 5, alternative: 'Any iron bolt', note: 'Iron, not aluminium' },
      { name: 'Enamelled copper wire', quantity: '2 m', estimatedCost: 40, alternative: 'Wire salvaged from a dead transformer', note: 'Scrape the ends bare' },
      { name: 'Cell, 1.5 V', quantity: '1', estimatedCost: 20, alternative: null, note: 'Do not use a mains adapter' },
      { name: 'Cell holder with leads', quantity: '1', estimatedCost: 20, alternative: 'Tape and two short wires', note: null },
      { name: 'Paper pins', quantity: '1 box', estimatedCost: 10, alternative: 'Staples', note: 'The load being lifted' },
      { name: 'Sandpaper', quantity: '1 small piece', estimatedCost: 5, alternative: 'A blade, adult-handled', note: 'To strip the enamel' },
    ],
    steps: [
      { title: 'Prepare the wire', description: 'Sand about 2 cm of enamel off both ends until the copper is bright. Skipping this is the single most common reason the experiment fails.', safetyNote: null },
      { title: 'Wind 50 turns', description: 'Wind neatly in one direction along the nail, counting aloud. Leave both ends free.', safetyNote: null },
      { title: 'Connect and count', description: 'Connect to the cell, dip the nail tip into the pins, lift, and count what comes up. Repeat three times and take the mean.', safetyNote: 'Disconnect between readings. The wire and cell get warm.' },
      { title: 'Add turns', description: 'Add 25 turns and repeat the count. Continue to about 150 turns, recording as you go.', safetyNote: null },
      { title: 'Plot the result', description: 'Graph pins lifted against number of turns and describe the trend in a sentence.', safetyNote: null },
      { title: 'Test the reversal', description: 'Swap the cell connections and check with a compass that the poles have reversed while the strength has not changed.', safetyNote: 'Never connect the coil across a mains supply or a car battery.' },
    ],
    learningOutcomes: [
      'Describe how coil turns affect electromagnet strength',
      'Explain that reversing current reverses polarity but not strength',
      'Plot and interpret a graph from repeated measurements',
    ],
    safetyPrecautions: [
      'Use a 1.5 V cell only — never mains electricity',
      'Disconnect between readings; the coil and cell heat up',
      'An adult supervises any use of a blade to strip wire',
      'Paper pins are sharp; count them back into the box afterwards',
    ],
  },
];

const run = async () => {
  await sequelize.authenticate();
  console.log('Connected.\n');

  const owner = await User.findOne({ where: { role: 'admin' } });
  if (!owner) {
    console.error('No admin account found. Run: npm run promote-admin -- <email>');
    process.exit(1);
  }
  console.log(`Publishing as the admin account (id ${owner.id.slice(0, 8)}…)\n`);

  let created = 0;
  let skipped = 0;

  for (const data of PROJECTS) {
    const existing = await Project.findOne({ where: { title: data.title } });
    if (existing) {
      console.log(`  skip    ${data.title} — already present`);
      skipped += 1;
      continue;
    }

    await Project.create({
      ...data,
      language: 'en',
      // Seeded guides are published directly: they are written to be read, and
      // parking them in the moderation queue would just be busywork.
      status: 'approved',
      rating: 0,
      createdBy: owner.id,
    });

    console.log(`  added   ${data.title}`);
    created += 1;
  }

  const total = await Project.count({ where: { status: 'approved' } });
  console.log(`\n${created} added, ${skipped} skipped. ${total} published guides in the library.`);
  await sequelize.close();
};

run().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});
