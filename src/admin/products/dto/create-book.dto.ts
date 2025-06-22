import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export enum BookCategory {
  EDUCATION='education',
  FICTION = 'fiction',
  NON_FICTION = 'non_fiction',
  SCIENCE = 'science',
  TECHNOLOGY = 'technology',
  BUSINESS = 'business',
  SELF_HELP = 'self_help',
  BIOGRAPHY = 'biography',
  HISTORY = 'history',
  PHILOSOPHY = 'philosophy',
  RELIGION = 'religion',
  POLITICS = 'politics',
  ECONOMICS = 'economics',
  PSYCHOLOGY = 'psychology',
  HEALTH = 'health',
  COOKING = 'cooking',
  TRAVEL = 'travel',
  SPORTS = 'sports',
  ARTS = 'arts',
  LITERATURE = 'literature',
  POETRY = 'poetry',
  DRAMA = 'drama',
  MYSTERY = 'mystery',
  THRILLER = 'thriller',
  ROMANCE = 'romance',
  FANTASY = 'fantasy',
  SCIENCE_FICTION = 'science_fiction',
  HORROR = 'horror',
  WESTERN = 'western',
  ADVENTURE = 'adventure',
  HUMOR = 'humor',
  COMICS = 'comics',
  GRAPHIC_NOVELS = 'graphic_novels',
  CHILDREN = 'children',
  YOUNG_ADULT = 'young_adult',
  ACADEMIC = 'academic',
  TEXTBOOK = 'textbook',
  REFERENCE = 'reference',
  DICTIONARY = 'dictionary',
  ENCYCLOPEDIA = 'encyclopedia',
  MAGAZINE = 'magazine',
  NEWSPAPER = 'newspaper',
  OTHER = 'other'
}

export enum BookGenre {
  EDUCATION = 'education',
  FICTION = 'fiction',
  NON_FICTION = 'non_fiction',
  MYSTERY = 'mystery',
  ROMANCE = 'romance',
  FANTASY = 'fantasy',
  SCIENCE_FICTION = 'science_fiction',
  HORROR = 'horror',
  BIOGRAPHY = 'biography',
  SELF_HELP = 'self_help',
  OTHER = 'other'
}

export enum BookLanguage {
  ENGLISH = 'english',
  SPANISH = 'spanish',
  FRENCH = 'french',
  GERMAN = 'german',
  CHINESE = 'chinese',
  JAPANESE = 'japanese'
}

export enum BookFormat {
  AUDIOBOOK = 'audiobook',
  E_BOOK = 'e_book',
  HARDCOVER = 'hardcover',
  PAPERBACK = 'paperback',
  HARDCOPY = 'hardcopy'
}

export class CreateBookDto {
  // Static validation arrays for use in controllers
  static readonly VALID_CATEGORIES = Object.values(BookCategory);
  static readonly VALID_GENRES = Object.values(BookGenre);
  static readonly VALID_FORMATS = Object.values(BookFormat);
  static readonly VALID_LANGUAGES = Object.values(BookLanguage);

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  qty: number;

  @IsNumber()
  normalPrice: number;

  @IsNumber()
  @IsNotEmpty()
  sellingPrice: number;

  @IsEnum(BookCategory)
  category: BookCategory;

  @IsEnum(BookLanguage)
  language: BookLanguage;

  @IsEnum(BookFormat)
  format: BookFormat;

  @IsEnum(BookGenre)
  genre: BookGenre;

  @IsString()
  rated: string;

  @IsString()
  coverImage: string;

  @IsString()
  @IsNotEmpty()
  isbn: string;

  @IsString()
  publisher: string;

  @IsString()
  commission: string;
}

export class CreateBooksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookDto)
  books: CreateBookDto[];
} 