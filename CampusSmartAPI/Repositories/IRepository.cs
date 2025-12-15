using System.Linq.Expressions;

namespace CampusSmartAPI.Repositories
{
    /// <summary>
    /// 通用数据访问接口
    /// </summary>
    /// <typeparam name="T">实体类型</typeparam>
    public interface IRepository<T> where T : class
    {
        /// <summary>
        /// 获取所有实体
        /// </summary>
        /// <returns>实体列表</returns>
        Task<IEnumerable<T>> GetAllAsync();
        
        /// <summary>
        /// 根据条件获取实体
        /// </summary>
        /// <param name="expression">查询条件</param>
        /// <returns>实体列表</returns>
        Task<IEnumerable<T>> GetAsync(Expression<Func<T, bool>> expression);
        
        /// <summary>
        /// 根据ID获取实体
        /// </summary>
        /// <param name="id">实体ID</param>
        /// <returns>实体对象</returns>
        Task<T> GetByIdAsync(object id);
        
        /// <summary>
        /// 添加实体
        /// </summary>
        /// <param name="entity">实体对象</param>
        /// <returns>添加的实体对象</returns>
        Task<T> AddAsync(T entity);
        
        /// <summary>
        /// 批量添加实体
        /// </summary>
        /// <param name="entities">实体列表</param>
        /// <returns>添加的实体数量</returns>
        Task<int> AddRangeAsync(IEnumerable<T> entities);
        
        /// <summary>
        /// 更新实体
        /// </summary>
        /// <param name="entity">实体对象</param>
        /// <returns>更新的实体对象</returns>
        Task<T> UpdateAsync(T entity);
        
        /// <summary>
        /// 删除实体
        /// </summary>
        /// <param name="entity">实体对象</param>
        /// <returns>是否删除成功</returns>
        Task<bool> DeleteAsync(T entity);
        
        /// <summary>
        /// 根据ID删除实体
        /// </summary>
        /// <param name="id">实体ID</param>
        /// <returns>是否删除成功</returns>
        Task<bool> DeleteByIdAsync(object id);
        
        /// <summary>
        /// 保存更改
        /// </summary>
        /// <returns>影响的行数</returns>
        Task<int> SaveChangesAsync();
    }
}