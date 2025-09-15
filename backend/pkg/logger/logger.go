package logger

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
)

// LogLevel represents the logging level
type LogLevel int

const (
	// DEBUG level logs
	DEBUG LogLevel = iota
	// INFO level logs
	INFO
	// WARN level logs
	WARN
	// ERROR level logs
	ERROR
	// FATAL level logs
	FATAL
)

var (
	levelStrings = []string{"DEBUG", "INFO", "WARN", "ERROR", "FATAL"}
	colors       = []string{"\033[36m", "\033[32m", "\033[33m", "\033[31m", "\033[35m"}
	resetColor   = "\033[0m"
)

// Logger is the main logger struct
type Logger struct {
	*log.Logger
	level  LogLevel
	mu     sync.Mutex
	writer io.Writer
}

// New creates a new Logger instance
func New(out io.Writer, prefix string, flag int, level LogLevel) *Logger {
	return &Logger{
		Logger: log.New(out, prefix, flag),
		level:  level,
		writer: out,
	}
}

// NewFileLogger creates a logger that writes to a file
func NewFileLogger(filename string, level LogLevel) (*Logger, error) {
	// Create directory if it doesn't exist
	dir := filepath.Dir(filename)
	if dir != "" {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, err
		}
	}

	file, err := os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return nil, err
	}

	return New(file, "", log.LstdFlags, level), nil
}

// SetLevel changes the log level
func (l *Logger) SetLevel(level LogLevel) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.level = level
}

// GetLevel returns the current log level
func (l *Logger) GetLevel() LogLevel {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.level
}

// Debug logs a debug message
func (l *Logger) Debug(v ...interface{}) {
	l.log(DEBUG, v...)
}

// Debugf logs a formatted debug message
func (l *Logger) Debugf(format string, v ...interface{}) {
	l.logf(DEBUG, format, v...)
}

// Info logs an info message
func (l *Logger) Info(v ...interface{}) {
	l.log(INFO, v...)
}

// Infof logs a formatted info message
func (l *Logger) Infof(format string, v ...interface{}) {
	l.logf(INFO, format, v...)
}

// Warn logs a warning message
func (l *Logger) Warn(v ...interface{}) {
	l.log(WARN, v...)
}

// Warnf logs a formatted warning message
func (l *Logger) Warnf(format string, v ...interface{}) {
	l.logf(WARN, format, v...)
}

// Error logs an error message
func (l *Logger) Error(v ...interface{}) {
	l.log(ERROR, v...)
}

// Errorf logs a formatted error message
func (l *Logger) Errorf(format string, v ...interface{}) {
	l.logf(ERROR, format, v...)
}

// Fatal logs a fatal message and exits
func (l *Logger) Fatal(v ...interface{}) {
	l.log(FATAL, v...)
	os.Exit(1)
}

// Fatalf logs a formatted fatal message and exits
func (l *Logger) Fatalf(format string, v ...interface{}) {
	l.logf(FATAL, format, v...)
	os.Exit(1)
}

// log writes a log message
func (l *Logger) log(level LogLevel, v ...interface{}) {
	if level < l.GetLevel() {
		return
	}

	_, file, line, ok := runtime.Caller(2)
	if !ok {
		file = "???"
		line = 0
	} else {
		// Shorten file path
		parts := strings.Split(file, "/")
		if len(parts) > 3 {
			file = strings.Join(parts[len(parts)-3:], "/")
		}
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	prefix := fmt.Sprintf("%s%-5s%s [%s:%d] ", colors[level], levelStrings[level], resetColor, file, line)
	l.Logger.SetPrefix(prefix)
	l.Logger.Println(v...)
	l.Logger.SetPrefix("")
}

// logf writes a formatted log message
func (l *Logger) logf(level LogLevel, format string, v ...interface{}) {
	if level < l.GetLevel() {
		return
	}

	_, file, line, ok := runtime.Caller(2)
	if !ok {
		file = "???"
		line = 0
	} else {
		// Shorten file path
		parts := strings.Split(file, "/")
		if len(parts) > 3 {
			file = strings.Join(parts[len(parts)-3:], "/")
		}
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	prefix := fmt.Sprintf("%s%-5s%s [%s:%d] ", colors[level], levelStrings[level], resetColor, file, line)
	l.Logger.SetPrefix(prefix)
	l.Logger.Printf(format, v...)
	l.Logger.SetPrefix("")
}

// Close closes any underlying resources (like file handles)
func (l *Logger) Close() error {
	l.mu.Lock()
	defer l.mu.Unlock()

	if closer, ok := l.writer.(io.Closer); ok {
		return closer.Close()
	}
	return nil
}

// Default logger instance
var (
	defaultLogger *Logger
	once          sync.Once
)

// Default returns the default logger instance
func Default() *Logger {
	once.Do(func() {
		defaultLogger = New(os.Stdout, "", log.LstdFlags, INFO)
	})
	return defaultLogger
}

// SetDefault sets the default logger instance
func SetDefault(logger *Logger) {
	defaultLogger = logger
}
