# Exchange Workflow System Documentation

## Overview

The Exchange Workflow System enables users to coordinate physical item exchanges between donors and receivers through a structured, multi-step process with real-time updates.

## Features

### 1. **Exchange Lifecycle States**

- `requested` - Initial request from receiver
- `accepted` - Donor accepts the request
- `declined` - Donor declines the request
- `scheduled` - Meeting time and location set
- `in_progress` - Exchange is happening
- `completed` - Exchange successfully finished
- `cancelled` - Either party cancels

### 2. **Meeting Coordination**

- **Date & Time Picker** - Schedule specific meeting times
- **Exchange Methods**:
  - Pickup - Receiver goes to donor's location
  - Delivery - Donor delivers to receiver
  - Meet Halfway - Both parties meet at neutral location
- **Location Management**:
  - Address input with GPS coordinates (optional)
  - Notes field for additional instructions

### 3. **Rating System**

- 5-star rating after completion
- Optional feedback text
- Separate ratings for giver and receiver
- Visible rating history

### 4. **Real-time Updates**

- Socket.IO integration for instant status changes
- Live notifications for both parties
- Connection status indicator
- Automatic UI synchronization

## File Structure

```
backend/
  src/
    models/
      Exchange.js                 # MongoDB schema with status workflow
    repositories/
      ExchangeRepository.js       # Database operations
    services/
      ExchangeService.js          # Business logic & validation
    controllers/
      ExchangeController.js       # REST API handlers
    routes/
      exchangeRoutes.js           # API endpoints
    config/
      socket.js                   # Socket event: exchange:update

frontend/
  src/
    services/
      exchangeService.js          # API client
    components/
      chat/
        ExchangeWidget.jsx        # Main exchange UI in chat
        MeetingScheduler.jsx      # Meeting scheduling modal
        RatingModal.jsx           # Rating submission modal
    contexts/
      SocketContext.jsx           # Added updateExchangeStatus method
```

## API Endpoints

### REST API

- `POST /api/exchanges` - Create new exchange request
- `GET /api/exchanges/chat/:chatId` - Get exchange by chat
- `GET /api/exchanges/my-exchanges` - Get user's exchanges (with status filter)
- `PATCH /api/exchanges/:id/status` - Update exchange status
- `PATCH /api/exchanges/:id/schedule` - Schedule meeting
- `POST /api/exchanges/:id/rate` - Submit rating
- `PATCH /api/exchanges/:id/cancel` - Cancel exchange

### Socket Events

- **Emit**: `exchange:update` - Send status update

  ```javascript
  socket.emit("exchange:update", {
    exchangeId: "123...",
    status: "accepted",
    note: "Looking forward to it!",
  });
  ```

- **Listen**: `exchange:status_changed` - Receive status updates
  ```javascript
  socket.on("exchange:status_changed", ({ exchangeId, status }) => {
    // Update UI
  });
  ```

## User Flow

### For Receivers (Requesting Item)

1. Open chat with item owner
2. Click "Request Item Exchange" button
3. Wait for owner to accept/decline
4. Once accepted, schedule meeting
5. Meet and receive item
6. Mark as completed
7. Rate the exchange

### For Givers (Donating Item)

1. Receive exchange request notification
2. Review request and accept/decline
3. Coordinate meeting time with receiver
4. Meet and give item
5. Mark as completed
6. Rate the exchange

## UI Components

### ExchangeWidget

- **Location**: Displayed in chat window when chat has associated post
- **Features**:
  - Status badge with color coding
  - Meeting details display (time, location, method)
  - Contextual action buttons based on status and role
  - Timeline of status history
  - Cancel option

### MeetingScheduler Modal

- Date/time picker with minimum date validation
- Exchange method dropdown
- Location address input
- GPS coordinates (optional)
- Additional notes textarea

### RatingModal

- Interactive 5-star rating system
- Hover effects for preview
- Optional feedback textarea
- Validation to ensure rating is selected

## Status Transition Validation

The backend validates status transitions to prevent invalid state changes:

- `requested` → `accepted`, `declined`
- `accepted` → `scheduled`, `cancelled`
- `scheduled` → `in_progress`, `cancelled`
- `in_progress` → `completed`, `cancelled`
- `completed` → (final state)
- `cancelled` → (final state)
- `declined` → (final state)

## Integration with Chat

The exchange widget automatically appears in the chat interface when:

- Chat is associated with a post (donation item)
- Post owner and interested user are chatting

The widget provides all exchange coordination tools within the chat context, eliminating the need to navigate away.

## Security

- Authentication required for all endpoints (JWT middleware)
- Authorization checks ensure only exchange participants can update
- User validation prevents unauthorized status changes
- Socket rooms ensure updates only reach relevant parties

## Future Enhancements

Potential features for future development:

- [ ] Location map integration (Google Maps API)
- [ ] Push notifications for status changes
- [ ] Photo upload upon completion (proof of exchange)
- [ ] Dispute resolution system
- [ ] Exchange statistics dashboard
- [ ] Recurring exchanges for regular donors
- [ ] QR code generation for meeting verification
- [ ] Integration with calendar apps (Google Calendar, Outlook)

## Testing Checklist

- [ ] Create exchange request
- [ ] Accept/decline request
- [ ] Schedule meeting with all field types
- [ ] Update exchange to in_progress
- [ ] Complete exchange
- [ ] Submit ratings from both users
- [ ] Cancel exchange at different stages
- [ ] Real-time socket updates between users
- [ ] Edge cases: offline users, network issues
- [ ] Unauthorized access attempts

## Usage Example

```javascript
// In Chat component
import ExchangeWidget from "./components/chat/ExchangeWidget";

<ChatWindow chat={selectedChat}>
  {/* Chat messages */}

  {selectedChat.post && (
    <ExchangeWidget
      chatId={selectedChat._id}
      post={selectedChat.post}
      onSchedule={() => setShowScheduler(true)}
      onRate={() => setShowRating(true)}
      onExchangeUpdate={(exchange) => setExchange(exchange)}
    />
  )}
</ChatWindow>;
```

## Notes

- All timestamps are stored in UTC and converted to local time in UI
- Exchange history tracks all status changes with timestamps
- Socket connection resilience ensures no updates are lost
- The system supports concurrent exchanges between same users for different items
