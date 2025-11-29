/**
 * UI Component Library - Design System Exports
 * =============================================
 * Atomic Design-based component library following SOLID principles.
 *
 * COMPONENT CATEGORIES:
 *
 * ATOMS (Basic Building Blocks):
 * - Button: Primary action element with variants
 * - Link: Standardized anchor with external handling
 * - Icon: Unified SVG icon system
 * - Tag: Category/label pill component
 *
 * LAYOUT ATOMS:
 * - Container: Centralized max-width/padding
 * - Grid: Responsive grid system
 * - Card: Flexible content container
 * - Section: Semantic section wrapper
 *
 * USAGE:
 * ```astro
 * import { Button, Link, Icon, Tag, Container, Grid, Card, Section } from '@/components/ui';
 *
 * <Container size="md">
 *   <Section title="Featured">
 *     <Grid cols="3">
 *       <Card variant="elevated">
 *         <Button variant="primary">Click Me</Button>
 *       </Card>
 *     </Grid>
 *   </Section>
 * </Container>
 * ```
 */

// =============================================================================
// ATOMS - Basic Building Blocks
// =============================================================================

export { default as Button } from "./Button.astro";
export { default as Link } from "./Link.astro";
export { default as Icon } from "./Icon.astro";
export { default as Tag } from "./Tag.astro";

// =============================================================================
// LAYOUT ATOMS
// =============================================================================

export { default as Container } from "./Container.astro";
export { default as Grid } from "./Grid.astro";
export { default as Card } from "./Card.astro";
export { default as Section } from "./Section.astro";

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

export { default as Hr } from "./Hr.astro";
export { default as LinkButton } from "./LinkButton.astro";
export { default as BackButton } from "./BackButton.astro";
export { default as Breadcrumb } from "./Breadcrumb.astro";
export { default as Pagination } from "./Pagination.astro";

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { Props as ButtonProps } from "./Button.astro";
export type { Props as LinkProps } from "./Link.astro";
export type { Props as IconProps, IconName } from "./Icon.astro";
export type { Props as TagProps } from "./Tag.astro";
export type { Props as ContainerProps } from "./Container.astro";
export type { Props as GridProps } from "./Grid.astro";
export type { Props as CardProps } from "./Card.astro";
export type { Props as SectionProps } from "./Section.astro";
