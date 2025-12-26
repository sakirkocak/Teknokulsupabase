// Typesense modülü - merkezi export

export { 
  typesenseClient,
  typesenseAdmin, 
  USE_TYPESENSE, 
  COLLECTIONS,
  isTypesenseAvailable
} from './client'

export { 
  leaderboardSchema, 
  questionsSchema,
  type LeaderboardDocument,
  type QuestionDocument 
} from './collections'

