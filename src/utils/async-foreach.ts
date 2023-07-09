export const asyncForEach = async <T>(
  data: T[],
  predicate: (item: T) => Promise<void>,
) => {
  return await Promise.all(
    data.map((item) => {
      return new Promise(async (resolve) => resolve(await predicate(item)))
    }),
  )
}
