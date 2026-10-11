// library.js - Workout Library Manager (Built-in + Custom Saved Workouts)

export const BUILTIN_WORKOUTS = [
  {
    id: 'builtin-1',
    name: '5x3min Threshold Intervals',
    category: 'Threshold',
    description: 'Classic 5x 3-minute intervals at 90% FTP with hard wattage recovery.',
    csv: `Segment,Duration,Mode,Target
Warmup,5,erg,0.50
Repeat,5
Set,3,erg,0.90
Rest,1,erg,120
End
Cooldown,5,erg,130`
  },
  {
    id: 'builtin-2',
    name: '4x4min VO2 Max Intervals',
    category: 'VO2 Max',
    description: 'High-intensity 4-minute intervals at 110% FTP to boost aerobic capacity.',
    csv: `Segment,Duration,Mode,Target
Warmup,10,erg,0.55
Tempo Primer,3,erg,0.80
Recovery,2,erg,100
Repeat,4
VO2 Max,4,erg,1.10
Recovery,3,erg,100
End
Cooldown,8,erg,0.50`
  },
  {
    id: 'builtin-3',
    name: 'Mountain Climb & Descents',
    category: 'Climbing (Grade)',
    description: 'Mixed-mode workout with real simulated inclines up to +8% and descents.',
    csv: `Segment,Duration,Mode,Target
Warmup Spin,5,erg,0.50
Approaching Foot,3,erg,160
Gentle Rise,3,grade,3.5%
Steep Pitch,5,grade,7.5%
False Flat,2,grade,1.0%
Final Summit Push,4,grade,8.5%
Fast Descent,3,grade,-2.0%
Cooldown,5,erg,100`
  },
  {
    id: 'builtin-4',
    name: 'Sweet Spot Over/Under (3x6min)',
    category: 'Sweet Spot',
    description: 'Alternating between 88% and 95% FTP to build lactate clearance.',
    csv: `Segment,Duration,Mode,Target
Warmup,8,erg,0.50
Primer,2,erg,0.85
Recovery,2,erg,110
Repeat,3
Under,2,erg,0.88
Over,1,erg,0.96
Under,2,erg,0.88
Over,1,erg,0.96
Rest,3,erg,110
End
Cooldown,6,erg,0.50`
  },
  {
    id: 'builtin-5',
    name: 'Sprint Power & Resistance',
    category: 'Sprints',
    description: 'Short explosive sprint intervals using trainer resistance brake mode.',
    csv: `Segment,Duration,Mode,Target
Warmup,8,erg,0.50
Spin Up,2,erg,0.75
Repeat,4
Sprint Blast,30s,resistance,9
Recovery Spin,2.5,erg,100
End
Cooldown,6,erg,0.45`
  },
  {
    id: 'builtin-6',
    name: 'Easy 25-min Recovery Spin',
    category: 'Recovery',
    description: 'Gentle aerobic blood-flow session below 60% FTP.',
    csv: `Segment,Duration,Mode,Target
Easy Spin,5,erg,0.45
Zone 1 Spin,15,erg,0.55
Cooldown,5,erg,0.40`
  }
];

const STORAGE_KEY = 'trainer_saved_workouts';
const OVERRIDES_STORAGE_KEY = 'trainer_workout_overrides';
const DELETED_STORAGE_KEY = 'trainer_deleted_workouts';

export class WorkoutLibrary {
  static getAllWorkouts() {
    const overrides = WorkoutLibrary.getBuiltinOverrides();
    const deleted = WorkoutLibrary.getDeletedBuiltinIds();
    const custom = WorkoutLibrary.getCustomWorkouts();
    const builtins = BUILTIN_WORKOUTS
      .filter(workout => !deleted.includes(workout.id))
      .map(workout => ({ ...workout, ...overrides[workout.id], isBuiltin: true }));
    return [...builtins, ...custom];
  }

  static getBuiltinOverrides() {
    try {
      return JSON.parse(localStorage.getItem(OVERRIDES_STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  static getDeletedBuiltinIds() {
    try {
      const ids = JSON.parse(localStorage.getItem(DELETED_STORAGE_KEY));
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  }

  static getCustomWorkouts() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveCustomWorkout(name, category, description, csv) {
    const list = WorkoutLibrary.getCustomWorkouts();
    const newWorkout = {
      id: 'custom-' + Date.now(),
      name: name || 'My Custom Workout',
      category: category || 'Custom',
      description: description || 'Custom user CSV workout',
      csv,
      isCustom: true
    };
    list.unshift(newWorkout);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newWorkout;
  }

  static deleteWorkout(id) {
    if (BUILTIN_WORKOUTS.some(workout => workout.id === id)) {
      const deleted = WorkoutLibrary.getDeletedBuiltinIds();
      if (!deleted.includes(id)) deleted.push(id);
      localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deleted));
      const overrides = WorkoutLibrary.getBuiltinOverrides();
      delete overrides[id];
      localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
      return WorkoutLibrary.getAllWorkouts();
    }

    const list = WorkoutLibrary.getCustomWorkouts().filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list;
  }

  static updateWorkout(id, name, category, description, csv) {
    const builtIn = BUILTIN_WORKOUTS.find(workout => workout.id === id);
    if (builtIn) {
      const overrides = WorkoutLibrary.getBuiltinOverrides();
      overrides[id] = { name, category, description, csv };
      localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
      return { ...builtIn, ...overrides[id], isBuiltin: true };
    }

    const list = WorkoutLibrary.getCustomWorkouts();
    const index = list.findIndex(workout => workout.id === id);
    if (index < 0) return null;
    list[index] = { ...list[index], name, category, description, csv };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list[index];
  }

  static getWorkoutById(id) {
    return WorkoutLibrary.getAllWorkouts().find(w => w.id === id) || null;
  }
}
