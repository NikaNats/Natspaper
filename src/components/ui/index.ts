/**
 * UI Component Library
 * ====================
 * Reusable, dumb/presentational components following SOLID principles.
 *
 * DESIGN PHILOSOPHY:
 * - All components are "dumb" - they handle presentation only
 * - Data fetching happens in pages/smart components
 * - Components are composed together, not inherited
 * - Extensibility via props and slots, not modification
 *
 * USAGE:
 * ```astro
 * import { Grid, Card, Section } from '@/components/ui';
 *
 * <Section title="Latest Posts">
 *   <Grid cols="responsive">
 *     {posts.map(post => (
 *       <Card variant="elevated" interactive>
 *         <PostContent {...post} />
 *       </Card>
 *     ))}
 *   </Grid>
 * </Section>
 * ```
 */

export { default as Grid } from "./Grid.astro";
export { default as Card } from "./Card.astro";
export { default as Section } from "./Section.astro";

// Re-export types for external use
export type { Props as GridProps } from "./Grid.astro";
export type { Props as CardProps } from "./Card.astro";
export type { Props as SectionProps } from "./Section.astro";
