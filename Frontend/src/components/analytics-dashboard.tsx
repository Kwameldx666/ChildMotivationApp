"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChevronLeft, ChevronRight, Filter } from "lucide-react"

const activityData = [
  { day: "Пн", tasks: 4, points: 320 },
  { day: "Вт", tasks: 6, points: 480 },
  { day: "Ср", tasks: 3, points: 240 },
  { day: "Чт", tasks: 5, points: 400 },
  { day: "Пт", tasks: 7, points: 560 },
  { day: "Сб", tasks: 2, points: 160 },
  { day: "Вс", tasks: 4, points: 320 },
]

const childrenStats = [
  { name: "Мария", value: 2450, fill: "#f59e0b", tasks: 45, rewards: 12 },
  { name: "Иван", value: 1980, fill: "#8b5cf6", tasks: 38, rewards: 9 },
  { name: "Анна", value: 1650, fill: "#ec4899", tasks: 32, rewards: 7 },
]

const categoryData = [
  { name: "Дом", value: 35, fill: "#10b981" },
  { name: "Учёба", value: 28, fill: "#3b82f6" },
  { name: "Питомцы", value: 18, fill: "#f59e0b" },
  { name: "Помощь", value: 19, fill: "#ef4444" },
]

const hourlyData = [
  { hour: "08:00", activity: 2 },
  { hour: "10:00", activity: 5 },
  { hour: "12:00", activity: 8 },
  { hour: "14:00", activity: 12 },
  { hour: "16:00", activity: 15 },
  { hour: "18:00", activity: 10 },
  { hour: "20:00", activity: 7 },
]

const progressData = [
  { week: "Нед 1", completed: 18, total: 25 },
  { week: "Нед 2", completed: 21, total: 28 },
  { week: "Нед 3", completed: 24, total: 30 },
  { week: "Нед 4", completed: 28, total: 32 },
]

const rewardCostsData = [
  { name: "🍕 Пицца", cost: 800 },
  { name: "🎬 Кино", cost: 600 },
  { name: "🎮 Игра", cost: 1200 },
  { name: "🎪 Парк", cost: 950 },
  { name: "📱 Наушники", cost: 1500 },
]

const earnRateData = [
  { day: "Пн", rate: 45 },
  { day: "Вт", rate: 80 },
  { day: "Ср", rate: 35 },
  { day: "Чт", rate: 60 },
  { day: "Пт", rate: 95 },
  { day: "Сб", rate: 20 },
  { day: "Вс", rate: 55 },
]

const taskStatusData = [
  { name: "Выполнено", value: 87, fill: "#10b981" },
  { name: "В работе", value: 18, fill: "#f59e0b" },
  { name: "Просрочено", value: 15, fill: "#ef4444" },
]

const trendData = [
  { date: "1 дек", points: 450 },
  { date: "8 дек", points: 720 },
  { date: "15 дек", points: 1050 },
  { date: "22 дек", points: 1380 },
  { date: "29 дек", points: 1850 },
]

const monthlyDistribution = [
  { type: "Выполнено", Мария: 45, Иван: 38, Анна: 32 },
  { type: "На проверке", Мария: 3, Иван: 2, Анна: 4 },
  { type: "Пропущено", Мария: 2, Иван: 3, Анна: 1 },
]

const topRewards = [
  { name: "🎮 Видеоигра", purchases: 12 },
  { name: "🍕 Пицца", purchases: 18 },
  { name: "🎬 Кино", purchases: 8 },
  { name: "🎪 Парк", purchases: 6 },
]

const chartsConfig = [
  { id: 0, title: "Активность в неделю", type: "bar" },
  { id: 1, title: "Опыт по детям", type: "pie" },
  { id: 2, title: "Задачи по категориям", type: "pie" },
  { id: 3, title: "Активность по часам", type: "line" },
  { id: 4, title: "Прогресс выполнения", type: "area" },
  { id: 5, title: "Стоимость наград", type: "bar" },
  { id: 6, title: "Темп заработка", type: "line" },
  { id: 7, title: "Статус задач", type: "pie" },
  { id: 8, title: "Тренд очков", type: "area" },
  { id: 9, title: "Распределение по детям", type: "bar" },
  { id: 10, title: "Популярные награды", type: "bar" },
]

export default function AnalyticsDashboard() {
  const [currentChart, setCurrentChart] = useState(0)
  const [selectedChild, setSelectedChild] = useState("all")

  const renderChart = (chartId: number) => {
    switch (chartId) {
      case 0:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasks" fill="#8b5cf6" name="Задачи" />
              <Bar dataKey="points" fill="#f59e0b" name="Очки" />
            </BarChart>
          </ResponsiveContainer>
        )
      case 1:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={childrenStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {childrenStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      case 2:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      case 3:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="activity" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )
      case 4:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="completed" stackId="1" stroke="#10b981" fill="#10b981" />
              <Area type="monotone" dataKey="total" stackId="1" stroke="#e5e7eb" fill="#e5e7eb" />
            </AreaChart>
          </ResponsiveContainer>
        )
      case 5:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rewardCostsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cost" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        )
      case 6:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earnRateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )
      case 7:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
      case 8:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="points" stroke="#8b5cf6" fill="#8b5cf6" />
            </AreaChart>
          </ResponsiveContainer>
        )
      case 9:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Мария" fill="#f59e0b" />
              <Bar dataKey="Иван" fill="#8b5cf6" />
              <Bar dataKey="Анна" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        )
      case 10:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topRewards} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="purchases" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }

  const nextChart = () => {
    setCurrentChart((prev) => (prev + 1) % chartsConfig.length)
  }

  const prevChart = () => {
    setCurrentChart((prev) => (prev - 1 + chartsConfig.length) % chartsConfig.length)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Всего очков заработано</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">12,480</p>
            <p className="text-xs text-muted-foreground mt-1">+15% от прошлой недели</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Завершённые задачи</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">87</p>
            <p className="text-xs text-muted-foreground mt-1">Из 120 всего</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Активные дети</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-secondary">3</p>
            <p className="text-xs text-muted-foreground mt-1">Все в сети</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{chartsConfig[currentChart].title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              График {currentChart + 1} из {chartsConfig.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prevChart}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextChart}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Фильтр по детям */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Filter className="w-4 h-4 mt-2 text-muted-foreground" />
            <Button
              variant={selectedChild === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChild("all")}
            >
              Вся семья
            </Button>
            {childrenStats.map((child) => (
              <Button
                key={child.name}
                variant={selectedChild === child.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChild(child.name)}
              >
                {child.name}
              </Button>
            ))}
          </div>
          {renderChart(currentChart)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Быстрые графики</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {chartsConfig.map((chart, idx) => (
              <Button
                key={chart.id}
                variant={currentChart === idx ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setCurrentChart(idx)}
              >
                {idx + 1}. {chart.title.slice(0, 12)}...
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
