package handlers

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/katuhangugi/tiktok-account-system/internal/utils/jwt"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Secure origin check for production
	CheckOrigin: func(r *http.Request) bool {
		allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
		if allowedOrigin == "" {
			allowedOrigin = "https://your-production-domain.com"
		}
		return r.Header.Get("Origin") == allowedOrigin
	},
	// Enable compression
	EnableCompression: true,
}

type WebSocketHandler struct {
	clients    map[uint]*websocket.Conn
	broadcast  chan WsMessage
	register   chan WsClient
	unregister chan uint
}

type WsMessage struct {
	UserID  uint
	Type    string
	Payload interface{}
}

type WsClient struct {
	UserID uint
	Conn   *websocket.Conn
}

func NewWebSocketHandler() *WebSocketHandler {
	return &WebSocketHandler{
		clients:    make(map[uint]*websocket.Conn),
		broadcast:  make(chan WsMessage),
		register:   make(chan WsClient),
		unregister: make(chan uint),
	}
}

func (h *WebSocketHandler) HandleConnections(c *gin.Context) {
	// Get token from query or header
	token := c.Query("token")
	if token == "" {
		token = c.GetHeader("Sec-WebSocket-Protocol")
	}

	claims, err := jwt.ValidateToken(token)
	if err != nil {
		log.Printf("WebSocket authentication failed: %v", err)
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	// Upgrade to WebSocket connection
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade WebSocket: %v", err)
		return
	}
	defer h.cleanupConnection(claims.UserID, ws)

	// Register client
	h.register <- WsClient{UserID: claims.UserID, Conn: ws}

	// Set up ping/pong handler
	ws.SetPingHandler(func(appData string) error {
		err := ws.WriteControl(websocket.PongMessage, []byte(appData), time.Now().Add(time.Second*10))
		if err != nil {
			log.Printf("Failed to send pong: %v", err)
			return err
		}
		return nil
	})

	// Set read deadline
	ws.SetReadDeadline(time.Now().Add(time.Minute * 5))

	// Message handling loop
	for {
		var msg WsMessage
		if err := ws.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Validate message type and content
		if msg.Type == "" {
			log.Printf("Invalid message type from user %d", claims.UserID)
			continue
		}

		// Process message
		h.handleMessage(claims.UserID, msg)
	}
}

func (h *WebSocketHandler) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client.UserID] = client.Conn
			log.Printf("Client connected: %d", client.UserID)

		case userID := <-h.unregister:
			if conn, ok := h.clients[userID]; ok {
				conn.Close()
				delete(h.clients, userID)
				log.Printf("Client disconnected: %d", userID)
			}

		case message := <-h.broadcast:
			if conn, ok := h.clients[message.UserID]; ok {
				if err := conn.WriteJSON(message); err != nil {
					log.Printf("Error broadcasting to user %d: %v", message.UserID, err)
					h.unregister <- message.UserID
				}
			}
		}
	}
}

func (h *WebSocketHandler) cleanupConnection(userID uint, ws *websocket.Conn) {
	ws.Close()
	h.unregister <- userID
}

func (h *WebSocketHandler) handleMessage(userID uint, msg WsMessage) {
	// Implement your message handling logic here
	// Validate and process different message types

	// Example: Broadcast to specific user
	h.broadcast <- WsMessage{
		UserID:  userID,
		Type:    "response",
		Payload: map[string]interface{}{"status": "received"},
	}
}
