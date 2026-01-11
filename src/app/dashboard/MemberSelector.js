'use client';
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search, User, Check } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const MemberSelector = ({ selectedMembers, onSelectionChange }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/manage');
        const data = await response.json();
        setUsers(data || []);
        setFilteredUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => {
      const firstName = (user.first_name || '').toLowerCase();
      const lastName = (user.rwandan_name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return firstName.includes(query) || lastName.includes(query) || email.includes(query);
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const toggleMember = (userId) => {
    const userIdStr = String(userId);
    const isSelected = selectedMembers.includes(userIdStr);
    
    if (isSelected) {
      onSelectionChange(selectedMembers.filter(id => id !== userIdStr));
    } else {
      onSelectionChange([...selectedMembers, userIdStr]);
    }
  };

  const removeMember = (userId) => {
    onSelectionChange(selectedMembers.filter(id => id !== userId));
  };

  const getUserName = (user) => {
    const firstName = user.first_name || '';
    const lastName = user.rwandan_name || '';
    return `${firstName} ${lastName}`.trim() || user.email || `User ${user.id}`;
  };

  const getSelectedUsers = () => {
    return users.filter(user => selectedMembers.includes(String(user.id)));
  };

  return (
    <div className="space-y-3">
      {/* Selected Members Display */}
      {selectedMembers.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-600 dark:text-gray-400">
            Selected Members ({selectedMembers.length})
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 dark:bg-gray-800/50 rounded-lg border border-neutral-200 dark:border-gray-700 min-h-[60px]">
            {getSelectedUsers().map(user => (
              <Badge
                key={user.id}
                variant="secondary"
                className="flex items-center gap-1.5 pr-1 py-1.5"
              >
                <User className="h-3 w-3" />
                <span className="text-xs">{getUserName(user)}</span>
                <button
                  type="button"
                  onClick={() => removeMember(String(user.id))}
                  className="ml-1 hover:bg-neutral-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* User List */}
      <div className="border border-neutral-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <ScrollArea className="h-[200px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-neutral-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              {searchQuery ? 'No users found' : 'No users available'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredUsers.map(user => {
                const userIdStr = String(user.id);
                const isSelected = selectedMembers.includes(userIdStr);
                
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleMember(user.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                      isSelected
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'hover:bg-neutral-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-green-600 border-green-600' 
                        : 'border-neutral-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <User className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-gray-100 truncate">
                        {getUserName(user)}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {selectedMembers.length === 0 && (
        <p className="text-xs text-neutral-500 dark:text-gray-400 text-center">
          Select at least one member to create the group
        </p>
      )}
    </div>
  );
};

export default MemberSelector;
