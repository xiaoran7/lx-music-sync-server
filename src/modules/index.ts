import { sync as listSync } from './list'
import { sync as dislikeSync } from './dislike'
import { sync as statisticsSync } from './statistics'

export const callObj = Object.assign({},
  listSync.handler,
  dislikeSync.handler,
  statisticsSync.handler,
)

export const modules = {
  list: listSync,
  dislike: dislikeSync,
  statistics: statisticsSync,
}


export { ListManage, ListEvent, type ListEventType } from './list'

export { DislikeManage, DislikeEvent, type DislikeEventType } from './dislike'

export { StatisticsManage, StatisticsEvent, type StatisticsEventType } from './statistics'

export const featureVersion = {
  list: 1,
  dislike: 1,
  statistics: 1,
} as const
