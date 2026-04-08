import { type ApiResponse, baseApi } from './baseApi'

export interface NotificationItem {
  id: string
  user_id: string | null
  company_id: string | null
  activity_event_id: string | null
  kind: string
  title: string
  body: string | null
  href: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<ApiResponse<NotificationItem[]>, number | void>({
      query: (limit) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications`,
        params: limit ? { limit } : undefined,
      }),
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation<ApiResponse<NotificationItem>, string>({
      query: (notificationId) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/${notificationId}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation<ApiResponse<{ updated: number }>, void>({
      query: () => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/read-all`,
        method: 'POST',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi
