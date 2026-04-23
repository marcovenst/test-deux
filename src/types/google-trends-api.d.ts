declare module "google-trends-api" {
  type InterestOverTimeInput = {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
  };

  const googleTrends: {
    interestOverTime: (input: InterestOverTimeInput) => Promise<string>;
  };

  export default googleTrends;
}
