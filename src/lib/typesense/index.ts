// Typesense modülü - merkezi export

export { typesenseAdmin, typesenseSearch, USE_TYPESENSE, COLLECTIONS } from './client'
export { 
  leaderboardSchema, 
  questionsSchema,
  type LeaderboardDocument,
  type QuestionDocument 
} from './collections'

