"use client";

import { Button } from "@/components/ui/button";
import { MdAdd, MdDelete } from "react-icons/md";
import AddContactDialog from "./AddContact/AddContactDialog";
import { useState } from "react";
import Avatar from "react-avatar";
import { getFirstAndLastWord } from "@/lib/utils";
import toast from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ContactListStep({ contacts, setContacts }) {
    const [openAddContactDialog, setOpenAddContactDialog] = useState(false);

    const handleAddContact = (newContacts) => {
        // Nếu là mảng các contact
        if (Array.isArray(newContacts)) {
            setContacts(prev => {
                const uniqueContacts = newContacts.filter(
                    newContact => !prev.some(
                        existingContact => existingContact.phone === newContact.phone
                    )
                );
                return [...prev, ...uniqueContacts];
            });
        }
        // Nếu là single contact
        else {
            setContacts(prev => {
                if (prev.some(contact => contact.phone === newContacts.phone)) {
                    toast.error("Số điện thoại đã tồn tại trong danh sách");
                    return prev;
                }
                return [...prev, newContacts];
            });
        }
        setOpenAddContactDialog(false);
    };

    const handleDeleteContact = (phoneToDelete) => {
        setContacts(prev => prev.filter(contact => contact.phone !== phoneToDelete));
    };

    return (
        <div className="flex flex-col gap-2">
            {openAddContactDialog && (
                <AddContactDialog
                    open={openAddContactDialog}
                    setOpen={setOpenAddContactDialog}
                    onAddContact={handleAddContact}
                />
            )}

            <div className="flex items-center justify-between">
                <h3>Danh sách khách hàng</h3>
                <Button
                    variant="ghost"
                    className="text-primary flex gap-1 hover:text-primary/80 "
                    onClick={() => setOpenAddContactDialog(true)}
                >
                    <MdAdd />
                    Thêm mới
                </Button>
            </div>

            <div className="flex flex-col gap-2 max-h-[55dvh] overflow-y-auto">
                {contacts.map((contact, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-4 px-4 py-2 border rounded-lg group"
                    >
                        <Avatar
                            name={getFirstAndLastWord(contact.name)}
                            size="40"
                            round
                            className="object-cover"
                        />
                        <div className="flex-1">
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">{contact.phone}</div>
                        </div>
                        {contact.note && (
                            <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                                {contact.note}
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive/80"
                            onClick={() => handleDeleteContact(contact.phone)}
                        >
                            <MdDelete className="h-5 w-5" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
} 