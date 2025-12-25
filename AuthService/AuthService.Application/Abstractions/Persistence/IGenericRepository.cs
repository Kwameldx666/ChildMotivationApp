namespace AuthService.Application.Abstractions.Persistence;

public interface IGenericRepository<TEntity, in TEntityId>
    where TEntity : class
    where TEntityId : IEquatable<TEntityId>
{
    Task<TEntity?> GetByIdAsync(TEntityId id);
    Task<IEnumerable<TEntity>> GetAllAsync();
    void Add(TEntity entity);
    void Update(TEntity entity);
    void Remove(TEntity entity);
}