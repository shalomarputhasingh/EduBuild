/**
 * Canned responses so the UI stays usable without a provider key.
 *
 * Selected explicitly with AI_PROVIDER=mock, or fallen back to in development
 * when the configured provider has no key. Never used in production — there,
 * a missing key is a configuration error and is reported as one.
 */

const NOTICE = '\n\n---\n*Mock provider — no AI key is configured. Set `AI_PROVIDER` and the matching key in `backend/.env` for real responses.*';

const CANNED = [
  {
    match: /volcano|eruption|baking soda|vinegar/i,
    reply: `## Baking soda volcano

**Materials** — 1.5L bottle, 3 tbsp baking soda, 200ml vinegar, red food colouring, tray, newspaper (~Rs 30)

**Steps**
1. Stand the bottle in a tray and pack clay or newspaper around it.
2. Add the baking soda and a few drops of colouring.
3. Pour the vinegar in and step back.

**The chemistry** — NaHCO₃ + CH₃COOH → CO₂ + H₂O + sodium acetate. The gas cannot escape fast enough through the neck, so it foams up and over.

**Where it goes wrong** — Too much vinegar at once and it is over in two seconds. Add it in stages so students can watch the reaction rate change.

**Safety** — Vinegar stings eyes. Keep faces above the bottle, not over it.`,
  },
  {
    match: /newton|third law|balloon car|rocket/i,
    reply: `## Balloon-powered car

**Materials** — Plastic bottle, 4 bottle caps, 2 straws, 2 skewers, 1 balloon, tape (~Rs 20)

**The physics** — Newton's third law. Air pushed backwards out of the balloon pushes the car forwards with equal force.

**Where it goes wrong** — Wheels that wobble eat most of the thrust. The skewer must spin freely inside the straw, and the caps must be centred, or the car veers instead of running straight. This is the whole lesson: students feel friction as a loss.

**Class question** — "Does a bigger balloon always mean a longer run?" It does not, past a point — mass and drag catch up.`,
  },
];

const DEFAULT_REPLY = `I would normally answer this with a full activity plan — materials, costs, steps, the concept, and the points where it usually goes wrong in a classroom.

Right now no AI provider is configured, so I am returning a placeholder.

In the meantime, the **Project Library** has ready-to-run guides you can filter by class level, subject and budget.`;

const replyFor = (message = '') => {
  const found = CANNED.find((entry) => entry.match.test(message));
  return (found ? found.reply : DEFAULT_REPLY) + NOTICE;
};

export default {
  name: 'mock',
  isConfigured: () => true,
  async chat({ message }) {
    return replyFor(message);
  },
  async generate({ prompt }) {
    return replyFor(prompt);
  },
};
