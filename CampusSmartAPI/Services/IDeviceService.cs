using CampusSmartAPI.Models;

namespace CampusSmartAPI.Services
{
    /// <summary>
    /// 设备服务接口
    /// </summary>
    public interface IDeviceService
    {
        /// <summary>
        /// 获取所有设备
        /// </summary>
        /// <returns>设备列表</returns>
        Task<IEnumerable<Device>> GetAllDevicesAsync();
        
        /// <summary>
        /// 根据ID获取设备
        /// </summary>
        /// <param name="id">设备ID</param>
        /// <returns>设备对象</returns>
        Task<Device> GetDeviceByIdAsync(int id);
        
        /// <summary>
        /// 根据状态获取设备
        /// </summary>
        /// <param name="status">设备状态</param>
        /// <returns>设备列表</returns>
        Task<IEnumerable<Device>> GetDevicesByStatusAsync(string status);
        
        /// <summary>
        /// 根据类型获取设备
        /// </summary>
        /// <param name="type">设备类型</param>
        /// <returns>设备列表</returns>
        Task<IEnumerable<Device>> GetDevicesByTypeAsync(string type);
        
        /// <summary>
        /// 添加设备
        /// </summary>
        /// <param name="device">设备对象</param>
        /// <returns>添加的设备对象</returns>
        Task<Device> AddDeviceAsync(Device device);
        
        /// <summary>
        /// 更新设备
        /// </summary>
        /// <param name="device">设备对象</param>
        /// <returns>更新的设备对象</returns>
        Task<Device> UpdateDeviceAsync(Device device);
        
        /// <summary>
        /// 删除设备
        /// </summary>
        /// <param name="id">设备ID</param>
        /// <returns>是否删除成功</returns>
        Task<bool> DeleteDeviceAsync(int id);
        
        /// <summary>
        /// 更新设备状态
        /// </summary>
        /// <param name="id">设备ID</param>
        /// <param name="status">新状态</param>
        /// <returns>更新的设备对象</returns>
        Task<Device> UpdateDeviceStatusAsync(int id, string status);
    }
}