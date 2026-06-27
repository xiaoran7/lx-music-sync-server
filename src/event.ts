// import { Event as App, type Type as AppType } from './AppEvent'
import {
  ListEvent,
  type ListEventType,
  DislikeEvent,
  type DislikeEventType,
  StatisticsEvent,
  type StatisticsEventType,
} from '@/modules'

export type {
  // AppType,
  ListEventType,
  DislikeEventType,
  StatisticsEventType,
}

// export const createAppEvent = (): AppType => {
//   return new App()
// }

export const createModuleEvent = () => {
  global.event_list = new ListEvent()
  global.event_dislike = new DislikeEvent()
  global.event_statistics = new StatisticsEvent()
}

