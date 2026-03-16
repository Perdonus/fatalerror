package session

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Session struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	SessionID    string `json:"session_id"`
	DeviceID     string `json:"device_id"`
	Email        string `json:"email"`
	Name         string `json:"name"`
}

type Store struct {
	path string
}

func NewStore() (*Store, error) {
	configRoot, err := os.UserConfigDir()
	if err != nil {
		return nil, err
	}
	root := filepath.Join(configRoot, "neuralv-shell")
	if err := os.MkdirAll(root, 0o700); err != nil {
		return nil, err
	}
	return &Store{path: filepath.Join(root, "session.json")}, nil
}

func (s *Store) Load() (*Session, error) {
	data, err := os.ReadFile(s.path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}
		return nil, err
	}
	var saved Session
	if err := json.Unmarshal(data, &saved); err != nil {
		if clearErr := s.Clear(); clearErr != nil {
			return nil, clearErr
		}
		return nil, nil
	}
	saved.normalize()
	if !saved.Valid() {
		if clearErr := s.Clear(); clearErr != nil {
			return nil, clearErr
		}
		return nil, nil
	}
	return &saved, nil
}

func (s *Store) Save(current *Session) error {
	if current == nil {
		return fmt.Errorf("session is nil")
	}
	normalized := *current
	normalized.normalize()
	if !normalized.Valid() {
		return fmt.Errorf("session is incomplete")
	}
	data, err := json.MarshalIndent(&normalized, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.path, data, 0o600)
}

func (s *Store) Clear() error {
	if err := os.Remove(s.path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}

func (s *Session) Valid() bool {
	if s == nil {
		return false
	}
	return strings.TrimSpace(s.Token) != "" && strings.TrimSpace(s.SessionID) != ""
}

func (s *Session) normalize() {
	if s == nil {
		return
	}
	s.Token = strings.TrimSpace(s.Token)
	s.RefreshToken = strings.TrimSpace(s.RefreshToken)
	s.SessionID = strings.TrimSpace(s.SessionID)
	s.DeviceID = strings.TrimSpace(s.DeviceID)
	s.Email = strings.ToLower(strings.TrimSpace(s.Email))
	s.Name = strings.TrimSpace(s.Name)
}
