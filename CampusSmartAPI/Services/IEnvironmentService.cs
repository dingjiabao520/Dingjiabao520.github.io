using CampusSmartAPI.Models;

namespace CampusSmartAPI.Services
{
    /// <summary>
    /// 环境数据服务接口
    /// </summary>
    public interface IEnvironmentService
    {
        /// <summary>
        /// 获取所有环境数据
        /// </summary>
        /// <returns>环境数据列表</returns>
        Task<IEnumerable<EnvironmentData>> GetAllEnvironmentDataAsync();
        
        /// <summary>
        /// 根据设备ID获取环境数据
        /// </summary>
        /// <param name="deviceId">设备ID</param>
        /// <returns>环境数据列表</returns>
        Task<IEnumerable<EnvironmentData>> GetEnvironmentDataByDeviceIdAsync(int deviceId);
        
        /// <summary>
        /// 根据时间范围获取环境数据
        /// </summary>
        /// <param name="startTime">开始时间</param>
        /// <param name="endTime">结束时间</param>
        /// <returns>环境数据列表</returns>
        Task<IEnumerable<EnvironmentData>> GetEnvironmentDataByTimeRangeAsync(DateTime startTime, DateTime endTime);
        
        /// <summary>
        /// 添加环境数据
        /// </summary>
        /// <param name="environmentData">环境数据对象</param>
        /// <returns>添加的环境数据对象</returns>
        Task<EnvironmentData> AddEnvironmentDataAsync(EnvironmentData environmentData);
        
        /// <summary>
        /// 批量添加环境数据
        /// </summary>
        /// <param name="environmentDataList">环境数据列表</param>
        /// <returns>添加的环境数据数量</returns>
        Task<int> AddEnvironmentDataRangeAsync(IEnumerable<EnvironmentData> environmentDataList);
        
        /// <summary>
        /// 获取设备最新环境数据
        /// </summary>
        /// <param name="deviceId">设备ID</param>
        /// <returns>最新环境数据</returns>
        Task<EnvironmentData> GetLatestEnvironmentDataByDeviceIdAsync(int deviceId);
    }
}