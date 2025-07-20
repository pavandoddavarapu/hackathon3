export interface StudentPerformanceRecord {
  gender: "male" | "female"
  race_ethnicity: "group A" | "group B" | "group C" | "group D" | "group E"
  parental_level_of_education:
    | "some high school"
    | "high school"
    | "some college"
    | "associate's degree"
    | "bachelor's degree"
    | "master's degree"
  lunch: "standard" | "free/reduced"
  test_preparation_course: "none" | "completed"
  math_score: number
  reading_score: number
  writing_score: number
}

export const mockStudentPerformanceData: StudentPerformanceRecord[] = [
  {
    gender: "female",
    race_ethnicity: "group B",
    parental_level_of_education: "bachelor's degree",
    lunch: "standard",
    test_preparation_course: "none",
    math_score: 72,
    reading_score: 72,
    writing_score: 74,
  },
  {
    gender: "female",
    race_ethnicity: "group C",
    parental_level_of_education: "some college",
    lunch: "standard",
    test_preparation_course: "completed",
    math_score: 69,
    reading_score: 90,
    writing_score: 88,
  },
  {
    gender: "female",
    race_ethnicity: "group B",
    parental_level_of_education: "master's degree",
    lunch: "standard",
    test_preparation_course: "none",
    math_score: 90,
    reading_score: 95,
    writing_score: 93,
  },
  {
    gender: "male",
    race_ethnicity: "group A",
    parental_level_of_education: "associate's degree",
    lunch: "free/reduced",
    test_preparation_course: "none",
    math_score: 47,
    reading_score: 57,
    writing_score: 44,
  },
  {
    gender: "male",
    race_ethnicity: "group C",
    parental_level_of_education: "some college",
    lunch: "standard",
    test_preparation_course: "none",
    math_score: 76,
    reading_score: 78,
    writing_score: 75,
  },
  {
    gender: "female",
    race_ethnicity: "group B",
    parental_level_of_education: "associate's degree",
    lunch: "standard",
    test_preparation_course: "none",
    math_score: 71,
    reading_score: 83,
    writing_score: 78,
  },
  {
    gender: "female",
    race_ethnicity: "group B",
    parental_level_of_education: "some college",
    lunch: "standard",
    test_preparation_course: "completed",
    math_score: 88,
    reading_score: 95,
    writing_score: 92,
  },
  {
    gender: "male",
    race_ethnicity: "group B",
    parental_level_of_education: "some college",
    lunch: "free/reduced",
    test_preparation_course: "none",
    math_score: 40,
    reading_score: 43,
    writing_score: 39,
  },
  {
    gender: "male",
    race_ethnicity: "group D",
    parental_level_of_education: "high school",
    lunch: "free/reduced",
    test_preparation_course: "completed",
    math_score: 64,
    reading_score: 64,
    writing_score: 67,
  },
  {
    gender: "female",
    race_ethnicity: "group D",
    parental_level_of_education: "associate's degree",
    lunch: "free/reduced",
    test_preparation_course: "none",
    math_score: 38,
    reading_score: 60,
    writing_score: 50,
  },
]
