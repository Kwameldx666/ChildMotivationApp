# Схема базы данных (для production)

## Таблица: Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR,
  last_name VARCHAR,
  role VARCHAR (parent/child),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Таблица: Profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR,
  last_name VARCHAR,
  avatar VARCHAR,
  age INTEGER,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0
);
```

## Таблица: Families
```sql
CREATE TABLE families (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  emblem VARCHAR,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

## Таблица: Family Members
```sql
CREATE TABLE family_members (
  id UUID PRIMARY KEY,
  family_id UUID REFERENCES families(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR (parent/child),
  joined_at TIMESTAMP
);
```

## Таблица: Tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  family_id UUID REFERENCES families(id),
  title VARCHAR NOT NULL,
  description TEXT,
  difficulty INTEGER,
  category VARCHAR,
  verify_type VARCHAR (photo/checklist),
  checklist TEXT [],
  xp_reward INTEGER,
  points_reward INTEGER,
  status VARCHAR (new/in_progress/pending/completed),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  due_date TIMESTAMP
);
```

## Таблица: Rewards
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY,
  family_id UUID REFERENCES families(id),
  title VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR,
  cost_points INTEGER,
  category VARCHAR,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

## Таблица: Purchases
```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY,
  reward_id UUID REFERENCES rewards(id),
  buyer_id UUID REFERENCES users(id),
  cost INTEGER,
  purchased_at TIMESTAMP
);
```

## Таблица: Achievements
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_name VARCHAR,
  description TEXT,
  icon VARCHAR,
  unlocked_at TIMESTAMP
);
```

## Таблица: Activity Log
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY,
  family_id UUID REFERENCES families(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR,
  details JSONB,
  created_at TIMESTAMP
);
