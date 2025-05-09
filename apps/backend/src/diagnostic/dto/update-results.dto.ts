export class UpdateResultsDto {
    results: { id?: string; minScore: number; maxScore: number; message: string }[];
}