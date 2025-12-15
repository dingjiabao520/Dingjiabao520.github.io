namespace CampusSmartAPI.Services
{
    /// <summary>
    /// 外部API服务接口
    /// </summary>
    public interface IExternalApiService
    {
        /// <summary>
        /// 从外部API获取环境数据
        /// </summary>
        /// <returns>环境数据列表</returns>
        Task<IEnumerable<Models.EnvironmentData>> FetchEnvironmentDataFromExternalApiAsync();
    }
}