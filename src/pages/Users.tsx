import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api, User } from "@/lib/api";
import { Trash2, Plus } from "lucide-react";

const Users = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "staff" as "admin" | "staff" | "customer",
  });

  const [selectedRole, setSelectedRole] = useState<"admin" | "staff" | "customer">("staff");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Benutzer konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.registerUser(newUser.email, newUser.password, newUser.name, newUser.role);
      setNewUser({ email: "", password: "", name: "", role: "staff" });
      setIsNewUserDialogOpen(false);
      toast({
        title: "Erfolg",
        description: "Benutzer wurde erfolgreich erstellt",
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Benutzer konnte nicht erstellt werden",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      await api.updateUserRole(selectedUser.id, selectedRole);
      setIsRoleDialogOpen(false);
      toast({
        title: "Erfolg",
        description: "Rolle wurde erfolgreich aktualisiert",
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Rolle konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Benutzer wirklich löschen?")) return;

    try {
      await api.deleteUser(id);
      toast({
        title: "Erfolg",
        description: "Benutzer wurde gelöscht",
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Benutzer konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-destructive text-white";
      case "staff":
        return "bg-blue-500 text-white";
      case "customer":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-300 text-black";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "staff":
        return "Personal";
      case "customer":
        return "Kunde";
      default:
        return role;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Benutzerverwaltung</h1>
            <Button onClick={() => setIsNewUserDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Neuer Benutzer
            </Button>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Alle Benutzer</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground">Benutzer werden geladen...</p>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground">Keine Benutzer vorhanden</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Rolle</TableHead>
                        <TableHead>Erstellt</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString("de-DE")}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setSelectedRole(user.role);
                                setIsRoleDialogOpen(true);
                              }}
                            >
                              Rolle ändern
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New User Dialog */}
      <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Neuer Benutzer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newUserName">Name *</Label>
              <Input
                id="newUserName"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Max Mustermann"
              />
            </div>
            <div>
              <Label htmlFor="newUserEmail">E-Mail *</Label>
              <Input
                id="newUserEmail"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="max@example.de"
              />
            </div>
            <div>
              <Label htmlFor="newUserPassword">Passwort *</Label>
              <Input
                id="newUserPassword"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Mindestens 8 Zeichen"
              />
            </div>
            <div>
              <Label htmlFor="newUserRole">Rolle *</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Kunde</SelectItem>
                  <SelectItem value="staff">Personal</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateUser} className="bg-primary">
                Erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Rolle ändern für {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Neue Rolle *</Label>
              <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Kunde</SelectItem>
                  <SelectItem value="staff">Personal</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdateRole} className="bg-primary">
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Users;
