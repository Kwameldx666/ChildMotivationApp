using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace ChildMotivationApp.Helpers;

public static class ObservableCollectionExtensions
{
    public static void BeginBatchUpdate<T>(this ObservableCollection<T> collection, IReadOnlyList<T> items)
    {
        if (collection == null)
        {
            throw new ArgumentNullException(nameof(collection));
        }

        if (items == null)
        {
            throw new ArgumentNullException(nameof(items));
        }

        collection.Clear();

        for (var i = 0; i < items.Count; i++)
        {
            collection.Add(items[i]);
        }
    }
}
