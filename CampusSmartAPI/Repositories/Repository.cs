using CampusSmartAPI.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace CampusSmartAPI.Repositories
{
    /// <summary>
    /// 通用数据访问实现
    /// </summary>
    /// <typeparam name="T">实体类型</typeparam>
    public class Repository<T> : IRepository<T> where T : class
    {
        protected readonly CampusSmartDbContext _context;
        protected readonly DbSet<T> _dbSet;
        
        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="context">数据库上下文</param>
        public Repository(CampusSmartDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }
        
        /// <inheritdoc/>
        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }
        
        /// <inheritdoc/>
        public async Task<IEnumerable<T>> GetAsync(Expression<Func<T, bool>> expression)
        {
            return await _dbSet.Where(expression).ToListAsync();
        }
        
        /// <inheritdoc/>
        public async Task<T> GetByIdAsync(object id)
        {
            return await _dbSet.FindAsync(id);
        }
        
        /// <inheritdoc/>
        public async Task<T> AddAsync(T entity)
        {
            var result = await _dbSet.AddAsync(entity);
            await _context.SaveChangesAsync();
            return result.Entity;
        }
        
        /// <inheritdoc/>
        public async Task<int> AddRangeAsync(IEnumerable<T> entities)
        {
            await _dbSet.AddRangeAsync(entities);
            return await _context.SaveChangesAsync();
        }
        
        /// <inheritdoc/>
        public async Task<T> UpdateAsync(T entity)
        {
            var result = _dbSet.Update(entity);
            await _context.SaveChangesAsync();
            return result.Entity;
        }
        
        /// <inheritdoc/>
        public async Task<bool> DeleteAsync(T entity)
        {
            _dbSet.Remove(entity);
            var result = await _context.SaveChangesAsync();
            return result > 0;
        }
        
        /// <inheritdoc/>
        public async Task<bool> DeleteByIdAsync(object id)
        {
            var entity = await GetByIdAsync(id);
            if (entity == null)
            {
                return false;
            }
            return await DeleteAsync(entity);
        }
        
        /// <inheritdoc/>
        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}