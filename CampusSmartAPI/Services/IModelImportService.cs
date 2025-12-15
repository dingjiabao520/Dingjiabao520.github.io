using CampusSmartAPI.Models;

namespace CampusSmartAPI.Services
{
    /// <summary>
    /// 模型数据导入服务接口
    /// </summary>
    public interface IModelImportService
    {
        /// <summary>
        /// 从JSON文件导入模型数据到数据库
        /// </summary>
        /// <param name="filePath">JSON文件路径</param>
        /// <param name="modelType">模型类型</param>
        /// <returns>导入结果</returns>
        Task<string> ImportModelFromJson(string filePath, string modelType);
        
        /// <summary>
        /// 获取导入状态
        /// </summary>
        /// <returns>导入状态信息</returns>
        string GetImportStatus();
    }
}