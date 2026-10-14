// Domain types shared by server and browser code. Values crossing into client
// entries must stay serializable, so dates are ISO strings.

export const DIFFICULTIES = ['mudah', 'sedang', 'sulit'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const RECIPE_STATUSES = ['draft', 'published', 'archived'] as const
export type RecipeStatus = (typeof RECIPE_STATUSES)[number]

export type NodeType = 'recipe' | 'ingredient'

/** SKPL-F-10.1 minimum relationship types. */
export const RELATION_TYPES = [
  'uses',
  'variation_of',
  'substitute_for',
  'similar_to',
  'inspired_by',
  'pairs_with',
] as const
export type RelationType = (typeof RELATION_TYPES)[number]

export interface Viewer {
  id: string
  name: string
  username: string
  avatarUrl: string | null
  isAdmin: boolean
}

export interface AuthorSummary {
  id: string
  name: string
  username: string
  avatarUrl: string | null
}

export interface RecipeLineageRef {
  id: string
  title: string
  authorName: string
}

export interface RecipeSummary {
  id: string
  title: string
  description: string
  imageUrl: string | null
  categories: string[]
  totalMinutes: number
  difficulty: Difficulty
  status: RecipeStatus
  author: AuthorSummary
  createdAt: string
  /** Source recipe when this recipe is a variation. */
  parent: RecipeLineageRef | null
  variationCount: number
}

export interface RecipeStep {
  title?: string
  text: string
  minutes?: number
}

export interface RecipeIngredientLine {
  ingredientId: string
  name: string
  quantity: number | null
  unit: string | null
  note: string | null
  section: string | null
}

export interface RecipeDetail extends RecipeSummary {
  prepMinutes: number
  cookMinutes: number
  servings: number
  steps: RecipeStep[]
  ingredients: RecipeIngredientLine[]
  changeSummary: string | null
  updatedAt: string
  saveCount: number
}

export interface IngredientSummary {
  id: string
  name: string
  imageUrl: string | null
}

export interface ExplicitRelation {
  id: string
  type: RelationType
  label: string | null
  /** Direction relative to the entity being viewed. */
  direction: 'outgoing' | 'incoming'
  other: { type: NodeType; id: string; name: string; imageUrl: string | null }
}
