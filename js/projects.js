/**
 * Case study content for the detail sheet.
 *
 * Structured as problem / approach / decisions / outcome rather than a feature
 * list, because a feature list does not tell a reader what you can do — it only
 * tells them what exists.
 */

export const PROJECTS = {
  qasas: {
    eyebrow: 'Client work — shipped and in daily use',
    title: 'Qasas CPA Firm',
    body: `
      <section>
        <h3>The problem</h3>
        <p>
          A Buffalo CPA firm was running on Squarespace. The platform limited what
          could be built, but the deeper problem was structural: like most firm
          sites, it listed services. A business owner does not wake up thinking
          "I need entity formation" — they think "I want to start something" or
          "I am selling up". The site answered a question nobody was asking.
        </p>
      </section>

      <section>
        <h3>The decision that shaped everything</h3>
        <p>
          I organised the entire site around the <strong>client's lifecycle instead of the
          firm's service menu</strong> — 8 stages running from "thinking about starting"
          through "running your business" and "building real wealth" to
          "something goes sideways" and "transitioning out". A visitor finds
          themselves first, and the relevant services follow from that.
        </p>
      </section>

      <section>
        <h3>What I built</h3>
        <ul>
          <li>A React&nbsp;19 SPA on Vite and Tailwind&nbsp;4 — <strong>30 routes across 10 page modules</strong>, with dynamic routes for services, guides, industries and tools.</li>
          <li><strong>9 interactive calculators</strong> — LLC vs S-corp, reasonable salary, break-even, payroll and bookkeeping cost, cost segregation, buy-vs-lease, and a gas-station sales tax calculator built for a specific local industry.</li>
          <li><strong>Published fees across 5 pricing tracks.</strong> Almost no firm puts pricing on the web; doing it meant modelling the fee structure properly rather than hiding it behind "contact us".</li>
          <li>A <strong>keyboard-driven search palette</strong> over the whole content set, so visitors can jump straight to a guide or tool.</li>
          <li><strong>19 resource guides</strong> covering New York sales tax edge cases — EBT/SNAP tender, grocery vs. taxable, prepaid fuel tax, cigarette tax credits — the unglamorous work competitors skip.</li>
          <li>Content served across <strong>20 industries</strong> and 5 languages the firm speaks in-house.</li>
        </ul>
      </section>

      <section>
        <h3>The architecture that makes it maintainable</h3>
        <p>
          All content lives in <strong>10 data modules — roughly 3,800 lines</strong> — entirely
          separate from components. Writing copy straight into JSX would have been
          faster on day one, but then every wording change becomes a developer
          ticket. Firm staff edit their own content without touching code, which is
          the difference between a site that stays current and one that rots.
        </p>
      </section>

      <section>
        <h3>Stack</h3>
        <p>React 19 · Vite 8 · Tailwind CSS 4 · React Router 7 · lucide-react · oxlint · sitemap generated at build time · deployed on Netlify.</p>
      </section>

      <div class="case__links">
        <a class="btn btn--small btn--primary" href="https://illustrious-mousse-721221.netlify.app/" target="_blank" rel="noopener">
          Visit the live site <svg class="icon" aria-hidden="true"><use href="#i-external"/></svg>
        </a>
      </div>
    `,
  },

  recipe: {
    eyebrow: 'Personal project — live demo',
    title: 'AI Recipe Recommender',
    body: `
      <section>
        <h3>The problem</h3>
        <p>
          Recipe sites work backwards: you pick a dish, then go shopping. The
          useful question is the reverse — given what is already in the kitchen,
          what can actually be cooked tonight?
        </p>
      </section>

      <section>
        <h3>How it works</h3>
        <ul>
          <li>Ingredient-based search against the <strong>Spoonacular API</strong>, with flexible parsing so input does not have to be formatted a particular way.</li>
          <li>Dietary filters for vegetarian, vegan, paleo, ketogenic, gluten-free and dairy-free.</li>
          <li>Filtering by maximum prep time and by cuisine.</li>
          <li>Results exportable to CSV via pandas, so a week of meals can be planned in one pass.</li>
        </ul>
      </section>

      <section>
        <h3>The interesting part</h3>
        <p>
          Ranking. A naive implementation returns exact matches, which is close to
          useless — having <strong>4 of 6</strong> ingredients for something good usually beats a
          perfect match for something you do not want. Results are ranked on both
          ingredients matched and ingredients missing, so near-misses surface
          instead of being filtered out.
        </p>
      </section>

      <section>
        <h3>What I would flag in review</h3>
        <p>
          The API has a hard request quota, so quota exhaustion is modelled as its
          own error type rather than being swallowed as a generic failure — the
          app can tell the user it is rate-limited instead of pretending no recipes
          exist. Keys are loaded from the environment, never committed.
        </p>
      </section>

      <section>
        <h3>Stack</h3>
        <p>Python · Spoonacular API · pandas · requests · Streamlit front end over an argparse CLI · deployed on Render.</p>
      </section>

      <div class="case__links">
        <a class="btn btn--small btn--primary" href="https://ai-recipe-recommender-09ot.onrender.com" target="_blank" rel="noopener">
          Open the live demo <svg class="icon" aria-hidden="true"><use href="#i-external"/></svg>
        </a>
        <a class="btn btn--small btn--ghost" href="https://github.com/MJamal12/Ai_Recipe_Recommender" target="_blank" rel="noopener">
          Source <svg class="icon" aria-hidden="true"><use href="#i-github"/></svg>
        </a>
      </div>
    `,
  },
};
