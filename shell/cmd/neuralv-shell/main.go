package main

import (
	"log"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/perdonus/neuralv-shell/internal/api"
	"github.com/perdonus/neuralv-shell/internal/app"
	"github.com/perdonus/neuralv-shell/internal/session"
)

func main() {
	store, err := session.NewStore()
	if err != nil {
		log.Fatal(err)
	}
	client := api.NewClient("https://sosiskibot.ru/basedata")
	program := tea.NewProgram(app.NewModel(client, store), tea.WithAltScreen())
	if _, err := program.Run(); err != nil {
		log.Fatal(err)
	}
}
