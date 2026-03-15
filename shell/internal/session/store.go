package session

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
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
	var session Session
	if err := json.Unmarshal(data, &session); err != nil {
		return nil, err
	}
	return &session, nil
}

func (s *Store) Save(session *Session) error {
	data, err := json.MarshalIndent(session, "", "  ")
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
