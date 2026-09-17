import type { LuxcieResearchResponse } from "./types"

/**
 * Shape-accurate sample matching the FastAPI backend response.
 * The `review` string carries lightweight markdown (headings, paragraphs,
 * bullet and numbered lists) plus inline [Author, Year] citations.
 */
export const SAMPLE_RESPONSE: LuxcieResearchResponse = {
  review: `## Overview

Microplastics pose a growing ecological threat to marine ecosystems worldwide [Smith et al., 2023]. As plastic production continues to outpace waste management capacity, these particles have become pervasive across every studied ocean basin.

## Key Findings

Research indicates that microplastic particles accumulate in phytoplankton and marine algae, significantly disrupting photosynthetic efficiency and cellular integrity [Garcia et al., 2022]. The primary mechanisms observed include:

- Reduced light availability from surface-adsorbed particles
- Oxidative stress at the cellular level [Smith et al., 2023]
- Physical blockage of gas and nutrient exchange

## Trophic Transfer

Furthermore, these contaminants transfer up the trophic web, affecting macro-organisms and fish populations [Johnson & Lee, 2024]. The bioaccumulation pathway typically follows a predictable progression:

1. Uptake by primary producers such as microalgae [Garcia et al., 2022]
2. Transfer to herbivorous zooplankton
3. Concentration in higher-order predators and commercial fish [Johnson & Lee, 2024]

## Conclusion

Taken together, the literature points to a compounding, ecosystem-wide risk that warrants coordinated monitoring and mitigation efforts.`,
  papers: [
    {
      title: "Effects of microplastic exposure on marine phytoplankton photosynthesis",
      authors: ["J. Smith", "A. Doe"],
      year: 2023,
      field: "Marine Biology",
      summary:
        "Demonstrates that high concentrations of polystyrene microplastics reduce photosynthetic efficiency in microalgae by 25%.",
      url: "https://www.semanticscholar.org/paper/example1",
    },
    {
      title: "Trophic transfer and bioaccumulation of microplastics in coastal ecosystems",
      authors: ["M. Garcia", "R. Martinez"],
      year: 2022,
      field: "Ecology",
      summary:
        "Investigates the uptake of microplastics by primary producers and their subsequent transfer to herbivorous zooplankton.",
      url: "https://www.semanticscholar.org/paper/example2",
    },
    {
      title: "Long-term toxicological impacts of nanoplastics on marine fauna",
      authors: ["K. Johnson", "L. Lee"],
      year: 2024,
      field: "Toxicology",
      summary:
        "Analyzes cellular stress markers in fish species exposed to persistent microplastic pollution over 12 months.",
      url: "https://www.semanticscholar.org/paper/example3",
    },
  ],
}
